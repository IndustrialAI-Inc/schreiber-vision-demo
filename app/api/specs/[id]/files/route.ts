import { NextResponse } from 'next/server';
import {
  getSpecFilesBySpecId,
  getSpecFileById,
  deleteSpecFile,
  deleteSpecFileChunksByFileId,
  updateSpecStats,
  getSpecById,
} from '@/lib/db/queries';

/**
 * GET /api/specs/[id]/files - Get all files for a specific spec
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

    console.log('[SPEC-FILES-API] Fetching files for spec:', id);

    // Check if spec exists
    const spec = await getSpecById({ id });
    if (!spec) {
      return NextResponse.json({ error: 'Spec not found' }, { status: 404 });
    }

    const files = await getSpecFilesBySpecId({ specId: id });

    const response = {
      specId: id,
      specName: spec.name,
      files: files.map((file) => ({
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
      summary: {
        totalFiles: files.length,
        completedFiles: files.filter((f) => f.processingStatus === 'completed')
          .length,
        pendingFiles: files.filter((f) => f.processingStatus === 'pending')
          .length,
        processingFiles: files.filter(
          (f) => f.processingStatus === 'processing',
        ).length,
        failedFiles: files.filter((f) => f.processingStatus === 'failed')
          .length,
        totalSize: files.reduce(
          (sum, f) => sum + Number.parseInt(f.fileSize),
          0,
        ),
        totalChunks: files.reduce((sum, f) => sum + f.chunkCount, 0),
        documentTypes: [
          ...new Set(files.map((f) => f.documentType).filter(Boolean)),
        ],
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[SPEC-FILES-API] Error fetching files:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch files',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/specs/[id]/files - Delete all files for a specific spec
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

    console.log('[SPEC-FILES-API] Deleting all files for spec:', id);

    // Check if spec exists
    const spec = await getSpecById({ id });
    if (!spec) {
      return NextResponse.json({ error: 'Spec not found' }, { status: 404 });
    }

    // Get files before deletion for response
    const files = await getSpecFilesBySpecId({ specId: id });

    // Delete all files for this spec (this will cascade to chunks)
    for (const file of files) {
      await deleteSpecFile({ id: file.id });
    }

    // Update spec statistics
    await updateSpecStats({
      id,
      fileCount: 0,
      totalSizeBytes: 0,
    });

    return NextResponse.json({
      success: true,
      message: `All files deleted for spec "${spec.name}"`,
      deletedFiles: files.length,
      deletedChunks: files.reduce((sum, f) => sum + f.chunkCount, 0),
    });
  } catch (error) {
    console.error('[SPEC-FILES-API] Error deleting files:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete files',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
