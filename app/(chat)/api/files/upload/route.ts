import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  createSpec,
  getSpecByName,
  createSpecFile,
  updateSpecFileProcessingStatus,
} from '@/lib/db/queries';
import { LocalStorage } from '@/lib/storage/local-storage';
import { specDocumentProcessor } from '@/lib/services/document-processor';

// Enhanced validation schema for spec-centric uploads
const SpecUploadSchema = z.object({
  specName: z
    .string()
    .min(1, 'Spec name is required')
    .max(500, 'Spec name too long'),
  files: z.array(z.instanceof(Blob)).min(1, 'At least one file is required'),
  supplierName: z.string().optional(),
  description: z.string().optional(),
  primaryFunction: z.string().optional(),
  category: z.string().optional(),
});

const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 50 * 1024 * 1024, {
      message: 'File size should be less than 50MB',
    })
    .refine(
      (file) =>
        ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'].includes(
          file.type,
        ),
      {
        message: 'File type should be JPEG, PNG, PDF, or TXT',
      },
    ),
});

export async function POST(request: Request) {
  console.log('[SPEC-UPLOAD] Starting spec-centric upload request');

  if (request.body === null) {
    console.log('[SPEC-UPLOAD] Empty request body');
    return new Response('Request body is empty', { status: 400 });
  }

  try {
    console.log('[SPEC-UPLOAD] Parsing form data');
    const formData = await request.formData();

    // Extract spec information
    const specName = formData.get('specName') as string;
    const supplierName = (formData.get('supplierName') as string) || undefined;
    const description = (formData.get('description') as string) || undefined;
    const primaryFunction =
      (formData.get('primaryFunction') as string) || undefined;
    const category = (formData.get('category') as string) || undefined;

    if (!specName) {
      return NextResponse.json(
        { error: 'Spec name is required' },
        { status: 400 },
      );
    }

    console.log('[SPEC-UPLOAD] Spec name:', specName);
    console.log('[SPEC-UPLOAD] Supplier name:', supplierName);

    // Extract files
    const files: File[] = [];
    const fileEntries = formData.getAll('files');

    for (const entry of fileEntries) {
      if (entry instanceof File) {
        files.push(entry);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    console.log('[SPEC-UPLOAD] Found', files.length, 'files to process');

    // Validate files
    const validatedFiles = [];
    for (const file of files) {
      const validatedFile = FileSchema.safeParse({ file });
      if (!validatedFile.success) {
        const errorMessage = validatedFile.error.errors
          .map((error) => error.message)
          .join(', ');
        return NextResponse.json(
          {
            error: `File ${file.name} validation failed: ${errorMessage}`,
          },
          { status: 400 },
        );
      }
      validatedFiles.push(file);
    }

    console.log('[SPEC-UPLOAD] All files validated successfully');

    // Create or get existing spec
    let spec = await getSpecByName({ name: specName });
    if (!spec) {
      console.log('[SPEC-UPLOAD] Creating new spec:', specName);
      spec = await createSpec({
        name: specName,
        supplierName,
        description,
        primaryFunction,
        category,
      });
      console.log('[SPEC-UPLOAD] Created spec with ID:', spec.id);
    } else {
      console.log('[SPEC-UPLOAD] Using existing spec:', spec.id);
    }

    // Process each file
    const uploadResults = [];
    const processingPromises = [];

    for (const file of validatedFiles) {
      try {
        console.log(`[SPEC-UPLOAD] Processing file: ${file.name}`);

        // Upload to storage
        const fileBuffer = await file.arrayBuffer();
        let uploadData: any;

        try {
          console.log(`[SPEC-UPLOAD] Uploading ${file.name} to Vercel blob...`);
          uploadData = await put(`specs/${spec.id}/${file.name}`, fileBuffer, {
            access: 'public',
          });
          console.log(
            `[SPEC-UPLOAD] Vercel blob upload successful:`,
            uploadData.url,
          );
        } catch (blobError) {
          console.log(
            `[SPEC-UPLOAD] Vercel blob failed, using local storage fallback...`,
          );
          const localStorage = new LocalStorage();
          uploadData = await localStorage.put(file.name, fileBuffer, {
            access: 'public',
            addRandomSuffix: true,
          });
          console.log(
            `[SPEC-UPLOAD] Local storage upload successful:`,
            uploadData.url,
          );
        }

        // Create spec file record
        const specFile = await createSpecFile({
          specId: spec.id,
          filename: file.name,
          originalFilename: file.name,
          fileUrl: uploadData.url,
          fileSize: file.size,
          contentType: file.type,
          documentType: detectDocumentType(file.name, file.type),
        });

        console.log(`[SPEC-UPLOAD] Created spec file record:`, specFile.id);

        uploadResults.push({
          fileId: specFile.id,
          filename: file.name,
          url: uploadData.url,
          size: file.size,
          type: file.type,
          status: 'uploaded',
        });

        // Start processing for PDF files
        if (file.type === 'application/pdf') {
          console.log(
            `[SPEC-UPLOAD] Starting background processing for ${file.name}`,
          );
          const processingPromise = processSpecFileAsync(
            spec.id,
            specFile.id,
            uploadData.url,
          );
          processingPromises.push(processingPromise);
        }
      } catch (fileError) {
        console.error(
          `[SPEC-UPLOAD] Failed to process file ${file.name}:`,
          fileError,
        );
        uploadResults.push({
          filename: file.name,
          error:
            fileError instanceof Error ? fileError.message : String(fileError),
          status: 'failed',
        });
      }
    }

    // Return response immediately, let processing continue in background
    const response = {
      success: true,
      spec: {
        id: spec.id,
        name: spec.name,
        supplierName: spec.supplierName,
        description: spec.description,
        primaryFunction: spec.primaryFunction,
        category: spec.category,
      },
      files: uploadResults,
      totalFiles: uploadResults.length,
      successfulUploads: uploadResults.filter((f) => f.status === 'uploaded')
        .length,
      failedUploads: uploadResults.filter((f) => f.status === 'failed').length,
      processingStatus:
        'Files uploaded successfully. Processing started in background.',
    };

    console.log('[SPEC-UPLOAD] Upload completed successfully');
    return NextResponse.json(response);
  } catch (error) {
    console.error('[SPEC-UPLOAD] Request processing error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process spec upload',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/**
 * Detect document type based on filename and content type
 */
function detectDocumentType(filename: string, contentType: string): string {
  const filenameLower = filename.toLowerCase();

  if (filenameLower.includes('allergen') || filenameLower.includes('allergy')) {
    return 'allergen_declaration';
  }
  if (filenameLower.includes('msds') || filenameLower.includes('safety')) {
    return 'msds_sheet';
  }
  if (filenameLower.includes('cert') || filenameLower.includes('certificate')) {
    return 'certificate';
  }
  if (
    filenameLower.includes('spec') ||
    filenameLower.includes('specification')
  ) {
    return 'specification_sheet';
  }
  if (
    filenameLower.includes('nutrition') ||
    filenameLower.includes('nutritional')
  ) {
    return 'nutritional_info';
  }

  return 'general_document';
}

/**
 * Process spec file asynchronously without blocking the upload response
 */
async function processSpecFileAsync(
  specId: string,
  fileId: string,
  fileUrl: string,
) {
  try {
    console.log(`[SPEC-PROCESS] Starting processing for file: ${fileId}`);

    // Small delay to ensure the file is saved to database
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Process the file using the new spec document processor
    await specDocumentProcessor.processSpecFile(specId, fileId, fileUrl);

    console.log(
      `[SPEC-PROCESS] Processing completed successfully for file: ${fileId}`,
    );
  } catch (error) {
    console.error(
      `[SPEC-PROCESS] Processing failed for file ${fileId}:`,
      error,
    );

    // Update file status to failed
    try {
      await updateSpecFileProcessingStatus({
        id: fileId,
        status: 'failed',
        errorMessage:
          error instanceof Error ? error.message : 'Unknown processing error',
      });
    } catch (updateError) {
      console.error(
        `[SPEC-PROCESS] Failed to update file status:`,
        updateError,
      );
    }
  }
}

/**
 * GET endpoint to check processing status
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const specId = searchParams.get('specId');

  if (!specId) {
    return NextResponse.json({ error: 'Spec ID is required' }, { status: 400 });
  }

  try {
    const { getSpecWithFilesAndMetadata } = await import('@/lib/db/queries');
    const specData = await getSpecWithFilesAndMetadata({ specId });

    if (!specData) {
      return NextResponse.json({ error: 'Spec not found' }, { status: 404 });
    }

    const processingStatus = {
      spec: specData.spec,
      files: specData.files.map((file) => ({
        id: file.id,
        filename: file.filename,
        status: file.processingStatus,
        uploadedAt: file.uploadedAt,
        processedAt: file.processedAt,
        chunkCount: file.chunkCount,
        errorMessage: file.errorMessage,
      })),
      metadata: specData.metadata,
      keyIngredients: specData.keyIngredients,
      totalFiles: specData.files.length,
      completedFiles: specData.files.filter(
        (f) => f.processingStatus === 'completed',
      ).length,
      failedFiles: specData.files.filter((f) => f.processingStatus === 'failed')
        .length,
      pendingFiles: specData.files.filter(
        (f) => f.processingStatus === 'pending',
      ).length,
      processingFiles: specData.files.filter(
        (f) => f.processingStatus === 'processing',
      ).length,
    };

    return NextResponse.json(processingStatus);
  } catch (error) {
    console.error('[SPEC-STATUS] Error getting processing status:', error);
    return NextResponse.json(
      {
        error: 'Failed to get processing status',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
