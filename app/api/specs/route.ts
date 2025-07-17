import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getAllSpecs,
  createSpec,
  getSpecStatistics,
  searchSpecsByMetadata,
  getSpecsWithMetadata,
} from '@/lib/db/queries';

// Validation schemas
const SpecCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Spec name is required')
    .max(500, 'Spec name too long'),
  supplierName: z.string().max(255, 'Supplier name too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  primaryFunction: z.string().max(100, 'Primary function too long').optional(),
  category: z.string().max(100, 'Category too long').optional(),
});

const SpecListSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  supplierName: z.string().optional(),
  category: z.string().optional(),
  isActive: z.boolean().default(true),
  includeMetadata: z.boolean().default(false),
});

/**
 * GET /api/specs - List all specs with optional filtering
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const queryParams = {
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 50,
      offset: searchParams.get('offset')
        ? Number(searchParams.get('offset'))
        : 0,
      supplierName: searchParams.get('supplierName') || undefined,
      category: searchParams.get('category') || undefined,
      isActive: searchParams.get('isActive') !== 'false',
      includeMetadata: searchParams.get('includeMetadata') === 'true',
    };

    const validatedParams = SpecListSchema.parse(queryParams);

    console.log('[SPEC-API] Fetching specs with params:', validatedParams);

    let specs: any[];

    if (validatedParams.includeMetadata) {
      // Include metadata in response
      const specsWithMetadata = await getSpecsWithMetadata({
        limit: validatedParams.limit,
        offset: validatedParams.offset,
      });
      specs = specsWithMetadata.map((item) => ({
        ...item.spec,
        metadata: item.metadata,
      }));
    } else {
      // Basic spec list without metadata
      specs = await getAllSpecs({
        limit: validatedParams.limit,
        offset: validatedParams.offset,
        supplierName: validatedParams.supplierName,
        category: validatedParams.category,
        isActive: validatedParams.isActive,
      });
    }

    // Get statistics for pagination info
    const stats = await getSpecStatistics();

    const response = {
      specs,
      pagination: {
        limit: validatedParams.limit,
        offset: validatedParams.offset,
        total: stats.totalSpecs,
        hasMore:
          validatedParams.offset + validatedParams.limit < stats.totalSpecs,
      },
      statistics: {
        totalSpecs: stats.totalSpecs,
        totalFiles: stats.totalFiles,
        totalChunks: stats.totalChunks,
        processingStats: stats.processingStats,
      },
      filters: {
        supplierName: validatedParams.supplierName,
        category: validatedParams.category,
        isActive: validatedParams.isActive,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[SPEC-API] Error fetching specs:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch specs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/specs - Create a new spec
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = SpecCreateSchema.parse(body);

    console.log('[SPEC-API] Creating spec:', validatedData.name);

    const spec = await createSpec(validatedData);

    return NextResponse.json(
      {
        success: true,
        spec,
        message: `Spec "${spec.name}" created successfully`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('[SPEC-API] Error creating spec:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid spec data', details: error.errors },
        { status: 400 },
      );
    }

    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json(
        {
          error: 'Spec name already exists',
          details: 'A spec with this name already exists',
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create spec',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
