import { NextResponse } from 'next/server';
import {
  getSpecStatistics,
  getSearchAnalytics,
  getAllSpecs,
  getSpecsWithMetadata,
} from '@/lib/db/queries';

/**
 * GET /api/analytics - Get comprehensive analytics and insights
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days')
      ? Number(searchParams.get('days'))
      : 7;

    console.log('[ANALYTICS-API] Fetching analytics for', days, 'days');

    // Get comprehensive statistics
    const [systemStats, searchAnalytics, recentSpecs, specsWithMetadata] =
      await Promise.all([
        getSpecStatistics(),
        getSearchAnalytics({ days, limit: 100 }),
        getAllSpecs({ limit: 10, isActive: true }),
        getSpecsWithMetadata({ limit: 20 }),
      ]);

    // Process search analytics
    const searchInsights = {
      totalSearches: searchAnalytics.length,
      successfulSearches: searchAnalytics.filter((s) => s.wasSuccessful).length,
      failedSearches: searchAnalytics.filter((s) => !s.wasSuccessful).length,
      averageResponseTime:
        searchAnalytics.length > 0
          ? Math.round(
              searchAnalytics.reduce((sum, s) => sum + s.responseTime, 0) /
                searchAnalytics.length,
            )
          : 0,
      searchTypes: {
        spec_specific: searchAnalytics.filter(
          (s) => s.searchType === 'spec_specific',
        ).length,
        cross_spec: searchAnalytics.filter((s) => s.searchType === 'cross_spec')
          .length,
        compliance: searchAnalytics.filter((s) => s.searchType === 'compliance')
          .length,
        discovery: searchAnalytics.filter((s) => s.searchType === 'discovery')
          .length,
      },
      topQueries: getTopQueries(searchAnalytics),
      searchTrends: getSearchTrends(searchAnalytics, days),
    };

    // Process spec analytics
    const specAnalytics = {
      totalSpecs: systemStats.totalSpecs,
      totalFiles: systemStats.totalFiles,
      totalChunks: systemStats.totalChunks,
      processingHealth: {
        ...systemStats.processingStats,
        healthScore: calculateProcessingHealth(systemStats.processingStats),
      },
      specDistribution: {
        bySupplier: getSpecsBySupplier(recentSpecs),
        byCategory: getSpecsByCategory(recentSpecs),
        byDocumentType: getDocumentTypeDistribution(specsWithMetadata),
      },
      metadataCompleteness: calculateMetadataCompleteness(specsWithMetadata),
    };

    // System health indicators
    const systemHealth = {
      overallScore: calculateOverallHealthScore(systemStats, searchInsights),
      indicators: [
        {
          name: 'Processing Queue',
          status:
            systemStats.processingStats.pending < 10 ? 'healthy' : 'warning',
          value: systemStats.processingStats.pending,
          description: 'Number of files pending processing',
        },
        {
          name: 'Search Success Rate',
          status:
            searchInsights.successfulSearches /
              Math.max(1, searchInsights.totalSearches) >
            0.9
              ? 'healthy'
              : 'warning',
          value: Math.round(
            (searchInsights.successfulSearches /
              Math.max(1, searchInsights.totalSearches)) *
              100,
          ),
          description: 'Percentage of successful searches',
        },
        {
          name: 'Average Response Time',
          status:
            searchInsights.averageResponseTime < 2000 ? 'healthy' : 'warning',
          value: searchInsights.averageResponseTime,
          description: 'Average search response time in milliseconds',
        },
        {
          name: 'Failed Processing',
          status:
            systemStats.processingStats.failed === 0 ? 'healthy' : 'warning',
          value: systemStats.processingStats.failed,
          description: 'Number of failed file processing attempts',
        },
      ],
    };

    const response = {
      systemStats,
      searchInsights,
      specAnalytics,
      systemHealth,
      generatedAt: new Date().toISOString(),
      period: `${days} days`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[ANALYTICS-API] Error fetching analytics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * Helper functions for analytics processing
 */

function getTopQueries(
  searches: any[],
): Array<{ query: string; count: number; avgResponseTime: number }> {
  const queryMap = new Map<
    string,
    { count: number; totalResponseTime: number }
  >();

  searches.forEach((search) => {
    const existing = queryMap.get(search.query) || {
      count: 0,
      totalResponseTime: 0,
    };
    queryMap.set(search.query, {
      count: existing.count + 1,
      totalResponseTime: existing.totalResponseTime + search.responseTime,
    });
  });

  return Array.from(queryMap.entries())
    .map(([query, stats]) => ({
      query,
      count: stats.count,
      avgResponseTime: Math.round(stats.totalResponseTime / stats.count),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function getSearchTrends(
  searches: any[],
  days: number,
): Array<{ date: string; count: number }> {
  const trends = new Map<string, number>();
  const now = new Date();

  // Initialize all days with 0
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    trends.set(date.toISOString().split('T')[0], 0);
  }

  // Count searches by day
  searches.forEach((search) => {
    const date = new Date(search.createdAt).toISOString().split('T')[0];
    trends.set(date, (trends.get(date) || 0) + 1);
  });

  return Array.from(trends.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getSpecsBySupplier(
  specs: any[],
): Array<{ supplier: string; count: number }> {
  const supplierMap = new Map<string, number>();

  specs.forEach((spec) => {
    const supplier = spec.supplierName || 'Unknown';
    supplierMap.set(supplier, (supplierMap.get(supplier) || 0) + 1);
  });

  return Array.from(supplierMap.entries())
    .map(([supplier, count]) => ({ supplier, count }))
    .sort((a, b) => b.count - a.count);
}

function getSpecsByCategory(
  specs: any[],
): Array<{ category: string; count: number }> {
  const categoryMap = new Map<string, number>();

  specs.forEach((spec) => {
    const category = spec.category || 'Uncategorized';
    categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
  });

  return Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

function getDocumentTypeDistribution(
  specsWithMetadata: any[],
): Array<{ type: string; count: number }> {
  const typeMap = new Map<string, number>();

  specsWithMetadata.forEach((item) => {
    if (item.spec && item.spec.fileCount > 0) {
      // This is a simplified version - in reality you'd need to query the actual file types
      typeMap.set('PDF', (typeMap.get('PDF') || 0) + 1);
    }
  });

  return Array.from(typeMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

function calculateMetadataCompleteness(specsWithMetadata: any[]): {
  totalSpecs: number;
  specsWithMetadata: number;
  completenessScore: number;
  categories: {
    allergens: number;
    nutrition: number;
    certifications: number;
    physical: number;
  };
} {
  const total = specsWithMetadata.length;
  const withMetadata = specsWithMetadata.filter((item) => item.metadata).length;

  let allergenCount = 0;
  let nutritionCount = 0;
  let certificationCount = 0;
  let physicalCount = 0;

  specsWithMetadata.forEach((item) => {
    if (item.metadata) {
      // Check for allergen data
      if (
        Object.values(item.metadata).some(
          (value: any) =>
            typeof value === 'boolean' &&
            value === true &&
            [
              'allergenDairy',
              'allergenGluten',
              'allergenNuts',
              'allergenSoy',
            ].includes(String(value)),
        )
      ) {
        allergenCount++;
      }

      // Check for nutrition data
      if (
        item.metadata.proteinPercent ||
        item.metadata.fatPercent ||
        item.metadata.carbsPercent
      ) {
        nutritionCount++;
      }

      // Check for certification data
      if (
        item.metadata.isOrganic ||
        item.metadata.isNonGmo ||
        item.metadata.isKosher
      ) {
        certificationCount++;
      }

      // Check for physical data
      if (
        item.metadata.ph ||
        item.metadata.viscosity ||
        item.metadata.density
      ) {
        physicalCount++;
      }
    }
  });

  return {
    totalSpecs: total,
    specsWithMetadata: withMetadata,
    completenessScore: total > 0 ? Math.round((withMetadata / total) * 100) : 0,
    categories: {
      allergens: allergenCount,
      nutrition: nutritionCount,
      certifications: certificationCount,
      physical: physicalCount,
    },
  };
}

function calculateProcessingHealth(stats: any): number {
  const total =
    stats.pending + stats.processing + stats.completed + stats.failed;
  if (total === 0) return 100;

  const successRate = stats.completed / total;
  const failureRate = stats.failed / total;
  const pendingRate = stats.pending / total;

  // Health score calculation
  let score = 100;
  score -= failureRate * 50; // Failures heavily impact score
  score -= pendingRate * 20; // Pending files moderately impact score
  score = Math.max(0, Math.min(100, score));

  return Math.round(score);
}

function calculateOverallHealthScore(
  systemStats: any,
  searchInsights: any,
): number {
  const processingHealth = calculateProcessingHealth(
    systemStats.processingStats,
  );
  const searchSuccessRate =
    searchInsights.totalSearches > 0
      ? (searchInsights.successfulSearches / searchInsights.totalSearches) * 100
      : 100;
  const responseTimeScore =
    searchInsights.averageResponseTime < 1000
      ? 100
      : searchInsights.averageResponseTime < 2000
        ? 80
        : 60;

  return Math.round(
    (processingHealth + searchSuccessRate + responseTimeScore) / 3,
  );
}
