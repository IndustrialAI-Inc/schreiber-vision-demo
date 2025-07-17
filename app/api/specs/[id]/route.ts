import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getSpecById,
  updateSpec,
  deleteSpec,
  getSpecWithFilesAndMetadata,
  deleteSpecFileChunksBySpecId,
  deleteSpecKeyIngredientsBySpecId,
} from '@/lib/db/queries';

// Validation schemas
const SpecUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Spec name is required')
    .max(500, 'Spec name too long')
    .optional(),
  supplierName: z.string().max(255, 'Supplier name too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  primaryFunction: z.string().max(100, 'Primary function too long').optional(),
  category: z.string().max(100, 'Category too long').optional(),
});

/**
 * GET /api/specs/[id] - Get a specific spec with full details
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'Spec ID is required' },
        { status: 400 },
      );
    }

    console.log('[SPEC-API] Fetching spec:', id);

    const specData = await getSpecWithFilesAndMetadata({ specId: id });

    if (!specData) {
      return NextResponse.json({ error: 'Spec not found' }, { status: 404 });
    }

    const response = {
      spec: specData.spec,
      files: specData.files.map((file) => ({
        id: file.id,
        filename: file.filename,
        originalFilename: file.originalFilename,
        fileUrl: file.fileUrl,
        fileSize: file.fileSize,
        contentType: file.contentType,
        documentType: file.documentType,
        processingStatus: file.processingStatus,
        chunkCount: file.chunkCount,
        uploadedAt: file.uploadedAt,
        processedAt: file.processedAt,
        errorMessage: file.errorMessage,
      })),
      metadata: specData.metadata,
      keyIngredients: specData.keyIngredients,
      summary: {
        totalFiles: specData.files.length,
        completedFiles: specData.files.filter(
          (f) => f.processingStatus === 'completed',
        ).length,
        pendingFiles: specData.files.filter(
          (f) => f.processingStatus === 'pending',
        ).length,
        processingFiles: specData.files.filter(
          (f) => f.processingStatus === 'processing',
        ).length,
        failedFiles: specData.files.filter(
          (f) => f.processingStatus === 'failed',
        ).length,
        totalChunks: specData.files.reduce((sum, f) => sum + f.chunkCount, 0),
        hasMetadata: !!specData.metadata,
        keyIngredientCount: specData.keyIngredients.length,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[SPEC-API] Error fetching spec:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch spec',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/specs/[id] - Update a specific spec
 */
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Spec ID is required' },
        { status: 400 },
      );
    }

    const validatedData = SpecUpdateSchema.parse(body);

    console.log('[SPEC-API] Updating spec:', id);

    // Check if spec exists
    const existingSpec = await getSpecById({ id });
    if (!existingSpec) {
      return NextResponse.json({ error: 'Spec not found' }, { status: 404 });
    }

    // Update the spec
    const updatedSpec = await updateSpec({
      id,
      ...validatedData,
    });

    return NextResponse.json({
      success: true,
      spec: updatedSpec,
      message: `Spec "${updatedSpec.name}" updated successfully`,
    });
  } catch (error) {
    console.error('[SPEC-API] Error updating spec:', error);

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
        error: 'Failed to update spec',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/specs/[id] - Delete a specific spec
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'Spec ID is required' },
        { status: 400 },
      );
    }

    console.log('[SPEC-API] Deleting spec:', id);

    // Check if spec exists
    const existingSpec = await getSpecById({ id });
    if (!existingSpec) {
      return NextResponse.json({ error: 'Spec not found' }, { status: 404 });
    }

    // Get spec data before deletion for response
    const specData = await getSpecWithFilesAndMetadata({ specId: id });

    // Delete the spec (this will cascade to files, chunks, metadata, etc.)
    await deleteSpec({ id });

    return NextResponse.json({
      success: true,
      message: `Spec "${existingSpec.name}" deleted successfully`,
      deletedSpec: {
        id: existingSpec.id,
        name: existingSpec.name,
        supplierName: existingSpec.supplierName,
        filesDeleted: specData?.files.length || 0,
        chunksDeleted:
          specData?.files.reduce((sum, f) => sum + f.chunkCount, 0) || 0,
      },
    });
  } catch (error) {
    console.error('[SPEC-API] Error deleting spec:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete spec',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
