import { NextResponse } from 'next/server';
import { getSpecStatistics, getSearchAnalytics } from '@/lib/db/queries';

/**
 * GET /api/health - System health check endpoint
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Test database connectivity
    const stats = await getSpecStatistics();
    const recentSearches = await getSearchAnalytics({ days: 1, limit: 10 });

    // Calculate health metrics
    const processingHealth = calculateProcessingHealth(stats.processingStats);
    const searchHealth = calculateSearchHealth(recentSearches);
    const dbResponseTime = Date.now() - startTime;

    // Overall system health
    const overallHealth = Math.round((processingHealth + searchHealth) / 2);

    const healthStatus = {
      status:
        overallHealth > 80
          ? 'healthy'
          : overallHealth > 60
            ? 'warning'
            : 'critical',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',

      // System metrics
      system: {
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          external: process.memoryUsage().external,
          rss: process.memoryUsage().rss,
        },
        cpu: {
          usage: process.cpuUsage(),
        },
        node: process.version,
      },

      // Database health
      database: {
        status: 'connected',
        responseTime: dbResponseTime,
        totalSpecs: stats.totalSpecs,
        totalFiles: stats.totalFiles,
        totalChunks: stats.totalChunks,
        processingQueue:
          stats.processingStats.pending + stats.processingStats.processing,
      },

      // Processing health
      processing: {
        health: processingHealth,
        status:
          processingHealth > 80
            ? 'healthy'
            : processingHealth > 60
              ? 'warning'
              : 'critical',
        stats: stats.processingStats,
        queueSize:
          stats.processingStats.pending + stats.processingStats.processing,
        failureRate:
          stats.processingStats.failed / Math.max(1, stats.totalFiles),
      },

      // Search health
      search: {
        health: searchHealth,
        status:
          searchHealth > 80
            ? 'healthy'
            : searchHealth > 60
              ? 'warning'
              : 'critical',
        recentSearches: recentSearches.length,
        successRate:
          recentSearches.length > 0
            ? recentSearches.filter((s) => s.wasSuccessful).length /
              recentSearches.length
            : 1,
        averageResponseTime:
          recentSearches.length > 0
            ? recentSearches.reduce((sum, s) => sum + s.responseTime, 0) /
              recentSearches.length
            : 0,
      },

      // Environment
      environment: {
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform,
        arch: process.arch,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },

      // Health indicators
      indicators: [
        {
          name: 'Database Connectivity',
          status: 'healthy',
          value: `${dbResponseTime}ms`,
          description: 'Database connection and query response time',
        },
        {
          name: 'Processing Queue',
          status: stats.processingStats.pending < 50 ? 'healthy' : 'warning',
          value: stats.processingStats.pending,
          description: 'Number of files waiting to be processed',
        },
        {
          name: 'Failed Processing',
          status: stats.processingStats.failed === 0 ? 'healthy' : 'warning',
          value: stats.processingStats.failed,
          description: 'Number of failed processing attempts',
        },
        {
          name: 'Search Performance',
          status: searchHealth > 80 ? 'healthy' : 'warning',
          value: `${Math.round(searchHealth)}%`,
          description: 'Search system performance and reliability',
        },
        {
          name: 'Memory Usage',
          status:
            process.memoryUsage().heapUsed / process.memoryUsage().heapTotal <
            0.8
              ? 'healthy'
              : 'warning',
          value: `${Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)}%`,
          description: 'Application memory usage',
        },
      ],

      // Overall health score
      health: {
        score: overallHealth,
        status:
          overallHealth > 80
            ? 'healthy'
            : overallHealth > 60
              ? 'warning'
              : 'critical',
        message: getHealthMessage(overallHealth),
      },
    };

    // Return appropriate HTTP status based on health
    const httpStatus = overallHealth > 60 ? 200 : 503;

    return NextResponse.json(healthStatus, { status: httpStatus });
  } catch (error) {
    console.error('[HEALTH] Health check failed:', error);

    return NextResponse.json(
      {
        status: 'critical',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        health: {
          score: 0,
          status: 'critical',
          message: 'System is experiencing critical issues',
        },
      },
      { status: 503 },
    );
  }
}

/**
 * Calculate processing health score
 */
function calculateProcessingHealth(stats: any): number {
  const total =
    stats.pending + stats.processing + stats.completed + stats.failed;
  if (total === 0) return 100;

  const successRate = stats.completed / total;
  const failureRate = stats.failed / total;
  const pendingRate = stats.pending / total;

  // Health score calculation
  let score = 100;
  score -= failureRate * 60; // Failures heavily impact score
  score -= pendingRate * 20; // Pending files moderately impact score
  score = Math.max(0, Math.min(100, score));

  return Math.round(score);
}

/**
 * Calculate search health score
 */
function calculateSearchHealth(searches: any[]): number {
  if (searches.length === 0) return 100; // No searches is neutral

  const successRate =
    searches.filter((s) => s.wasSuccessful).length / searches.length;
  const avgResponseTime =
    searches.reduce((sum, s) => sum + s.responseTime, 0) / searches.length;

  let score = 100;
  score *= successRate; // Success rate directly affects score

  // Response time penalty
  if (avgResponseTime > 3000) score *= 0.7;
  else if (avgResponseTime > 2000) score *= 0.8;
  else if (avgResponseTime > 1000) score *= 0.9;

  return Math.round(score);
}

/**
 * Get health message based on score
 */
function getHealthMessage(score: number): string {
  if (score > 90) return 'System is operating optimally';
  if (score > 80) return 'System is healthy with minor issues';
  if (score > 60) return 'System is experiencing some issues';
  if (score > 40) return 'System has significant issues that need attention';
  return 'System is in critical condition';
}

/**
 * HEAD /api/health - Simple health check for load balancers
 */
export async function HEAD() {
  try {
    // Quick database connectivity check
    await getSpecStatistics();
    return new Response(null, { status: 200 });
  } catch (error) {
    return new Response(null, { status: 503 });
  }
}
