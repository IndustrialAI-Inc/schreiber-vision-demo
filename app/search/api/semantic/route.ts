import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import {
  SearchService,
  type SearchResult,
} from '@/lib/services/search-service';
import { getUserFilesByUserId } from '@/lib/db/queries';

export const maxDuration = 60;

interface SearchRequest {
  query: string;
  limit?: number;
  similarityThreshold?: number;
  fileIds?: string[];
  searchType?: 'basic' | 'advanced' | 'intelligent';
  metadataFilters?: Record<string, any>;
}

interface SearchResponse {
  success: boolean;
  query: string;
  searchType: string;
  results: Array<{
    id: string;
    fileId: string;
    content: string;
    similarity: number;
    chunkIndex: number;
    metadata: any;
    fileName?: string; // Add file name for better UX
  }>;
  metadata: {
    totalResults: number;
    totalSearched: number;
    similarityThreshold: number;
    processingTimeMs: number; // Add performance monitoring
    timestamp: string;
  };
}

export async function POST(request: NextRequest) {
  const startTime = performance.now();

  try {
    // Authenticate the user
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const body: SearchRequest = await request.json();

    // Comprehensive input validation
    if (!body.query || typeof body.query !== 'string') {
      return NextResponse.json(
        { error: 'Query parameter is required and must be a string' },
        { status: 400 },
      );
    }

    if (body.query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query cannot be empty' },
        { status: 400 },
      );
    }

    if (body.query.length > 10000) {
      return NextResponse.json(
        { error: 'Query too long (max 10,000 characters)' },
        { status: 400 },
      );
    }

    if (body.limit !== undefined) {
      if (!Number.isInteger(body.limit) || body.limit < 1 || body.limit > 100) {
        return NextResponse.json(
          { error: 'Limit must be an integer between 1 and 100' },
          { status: 400 },
        );
      }
    }

    if (body.similarityThreshold !== undefined) {
      if (
        typeof body.similarityThreshold !== 'number' ||
        body.similarityThreshold < 0 ||
        body.similarityThreshold > 1
      ) {
        return NextResponse.json(
          { error: 'Similarity threshold must be a number between 0 and 1' },
          { status: 400 },
        );
      }
    }

    if (body.fileIds !== undefined) {
      if (!Array.isArray(body.fileIds) || body.fileIds.length > 50) {
        return NextResponse.json(
          { error: 'FileIds must be an array with maximum 50 elements' },
          { status: 400 },
        );
      }

      if (
        !body.fileIds.every((id) => typeof id === 'string' && id.length > 0)
      ) {
        return NextResponse.json(
          { error: 'All fileIds must be non-empty strings' },
          { status: 400 },
        );
      }
    }

    console.log(
      `[SEMANTIC_SEARCH] New search request from user ${session.user.id}: "${body.query}"`,
    );

    // Get user files for context and file name mapping
    const userFiles = await getUserFilesByUserId({ userId: session.user.id });
    const pdfFiles = userFiles.filter(
      (file) => file.fileType === 'application/pdf',
    );

    if (pdfFiles.length === 0) {
      return NextResponse.json({
        success: true,
        query: body.query,
        searchType: body.searchType || 'basic',
        results: [],
        metadata: {
          totalResults: 0,
          totalSearched: 0,
          similarityThreshold: body.similarityThreshold || 0.1,
          processingTimeMs: performance.now() - startTime,
          timestamp: new Date().toISOString(),
          message:
            'No PDF documents found. Please upload supplier specifications first.',
        },
      } as SearchResponse);
    }

    // Initialize search service
    const searchService = new SearchService();

    // Prepare search options
    const searchOptions = {
      limit: body.limit || 10,
      similarityThreshold: body.similarityThreshold || 0.1,
      fileIds: body.fileIds || pdfFiles.map((file) => file.id),
      metadataFilters: body.metadataFilters,
    };

    console.log(
      `[SEMANTIC_SEARCH] Searching across ${searchOptions.fileIds?.length || 0} PDF files`,
    );

    // Perform search based on type
    let results: SearchResult[];
    const searchType = body.searchType || 'basic';

    try {
      switch (searchType) {
        case 'advanced': {
          results = await searchService.advancedSearch(
            body.query,
            searchOptions,
          );
          break;
        }

        case 'intelligent': {
          const intelligentResults = await searchService.intelligentSearch(
            body.query,
            searchOptions,
          );

          const processingTime = performance.now() - startTime;

          return NextResponse.json({
            success: true,
            query: body.query,
            searchType,
            results: {
              primary: intelligentResults.primary.map((result) => ({
                ...result,
                similarity: Math.round(result.similarity * 10000) / 10000,
                fileName: pdfFiles.find((f) => f.id === result.fileId)
                  ?.fileName,
              })),
              expanded: intelligentResults.expanded.map((result) => ({
                ...result,
                similarity: Math.round(result.similarity * 10000) / 10000,
                fileName: pdfFiles.find((f) => f.id === result.fileId)
                  ?.fileName,
              })),
              totalResults: intelligentResults.totalResults,
            },
            metadata: {
              totalSearched: searchOptions.fileIds?.length || 0,
              similarityThreshold: searchOptions.similarityThreshold,
              processingTimeMs: processingTime,
              timestamp: new Date().toISOString(),
            },
          });
        }

        case 'basic':
        default: {
          results = await searchService.search(body.query, searchOptions);
          break;
        }
      }
    } catch (searchError) {
      console.error('[SEMANTIC_SEARCH] Search execution failed:', searchError);
      return NextResponse.json(
        {
          error: 'Search execution failed',
          details:
            searchError instanceof Error
              ? searchError.message
              : 'Unknown search error',
        },
        { status: 500 },
      );
    }

    const processingTime = performance.now() - startTime;

    // Format response with enhanced metadata
    const response: SearchResponse = {
      success: true,
      query: body.query,
      searchType,
      results: results.map((result) => ({
        id: result.id,
        fileId: result.fileId,
        content: result.content,
        similarity: Math.round(result.similarity * 10000) / 10000,
        chunkIndex: result.chunkIndex,
        metadata: result.metadata,
        fileName: pdfFiles.find((f) => f.id === result.fileId)?.fileName,
      })),
      metadata: {
        totalResults: results.length,
        totalSearched: searchOptions.fileIds?.length || 0,
        similarityThreshold: searchOptions.similarityThreshold,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
      },
    };

    console.log(
      `[SEMANTIC_SEARCH] Returning ${results.length} results for query: "${body.query}" (${processingTime.toFixed(2)}ms)`,
    );

    // Add caching headers for performance
    const headers = new Headers();
    headers.set('Cache-Control', 'private, max-age=300'); // Cache for 5 minutes
    headers.set('X-Processing-Time', processingTime.toString());

    return NextResponse.json(response, { headers });
  } catch (error) {
    const processingTime = performance.now() - startTime;
    console.error('[SEMANTIC_SEARCH] Unexpected error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const startTime = performance.now();

  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query from URL parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = Number.parseInt(searchParams.get('limit') || '10');
    const threshold = Number.parseFloat(searchParams.get('threshold') || '0.1');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 },
      );
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 },
      );
    }

    if (threshold < 0 || threshold > 1) {
      return NextResponse.json(
        { error: 'Threshold must be between 0 and 1' },
        { status: 400 },
      );
    }

    console.log(`[SEMANTIC_SEARCH] GET request for query: "${query}"`);

    // Get user's PDF files
    const userFiles = await getUserFilesByUserId({ userId: session.user.id });
    const pdfFiles = userFiles.filter(
      (file) => file.fileType === 'application/pdf',
    );

    if (pdfFiles.length === 0) {
      return NextResponse.json({
        success: true,
        query,
        results: [],
        metadata: {
          totalResults: 0,
          totalSearched: 0,
          similarityThreshold: threshold,
          processingTimeMs: performance.now() - startTime,
          timestamp: new Date().toISOString(),
          message: 'No PDF documents found.',
        },
      });
    }

    const searchService = new SearchService();
    const results = await searchService.search(query, {
      limit,
      similarityThreshold: threshold,
      fileIds: pdfFiles.map((file) => file.id),
    });

    const processingTime = performance.now() - startTime;

    const response = {
      success: true,
      query,
      results: results.map((result) => ({
        id: result.id,
        fileId: result.fileId,
        content:
          result.content.substring(0, 500) +
          (result.content.length > 500 ? '...' : ''),
        similarity: Math.round(result.similarity * 10000) / 10000,
        chunkIndex: result.chunkIndex,
        fileName: pdfFiles.find((f) => f.id === result.fileId)?.fileName,
      })),
      metadata: {
        totalResults: results.length,
        totalSearched: pdfFiles.length,
        similarityThreshold: threshold,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
      },
    };

    // Add caching headers
    const headers = new Headers();
    headers.set('Cache-Control', 'private, max-age=300');
    headers.set('X-Processing-Time', processingTime.toString());

    return NextResponse.json(response, { headers });
  } catch (error) {
    const processingTime = performance.now() - startTime;
    console.error('[SEMANTIC_SEARCH] GET request error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
