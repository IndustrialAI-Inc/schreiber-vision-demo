import 'server-only';

import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  ne,
  or,
  like,
  ilike,
  isNotNull,
  isNull,
  type SQL,
  sql,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  spec,
  specFile,
  specFileChunk,
  specMetadata,
  specKeyIngredients,
  specSearchLog,
  type Spec,
  type NewSpec,
  type SpecFile,
  type NewSpecFile,
  type SpecFileChunk,
  type NewSpecFileChunk,
  type SpecMetadata,
  type NewSpecMetadata,
  type SpecKeyIngredients,
  type NewSpecKeyIngredients,
  type SpecSearchLog,
  type NewSpecSearchLog,
} from './schema';

// ========================================
// DATABASE CONNECTION
// ========================================

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// ========================================
// SPEC MANAGEMENT QUERIES
// ========================================

export async function createSpec({
  name,
  supplierName,
  description,
  primaryFunction,
  category,
}: {
  name: string;
  supplierName?: string;
  description?: string;
  primaryFunction?: string;
  category?: string;
}): Promise<Spec> {
  try {
    const [newSpec] = await db
      .insert(spec)
      .values({
        name,
        supplierName,
        description,
        primaryFunction,
        category,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newSpec;
  } catch (error) {
    console.error('Failed to create spec in database:', error);
    throw error;
  }
}

export async function getSpecByName({
  name,
}: { name: string }): Promise<Spec | null> {
  try {
    const [foundSpec] = await db.select().from(spec).where(eq(spec.name, name));
    return foundSpec || null;
  } catch (error) {
    console.error('Failed to get spec by name from database:', error);
    throw error;
  }
}

export async function getSpecById({
  id,
}: { id: string }): Promise<Spec | null> {
  try {
    const [foundSpec] = await db.select().from(spec).where(eq(spec.id, id));
    return foundSpec || null;
  } catch (error) {
    console.error('Failed to get spec by id from database:', error);
    throw error;
  }
}

export async function getAllSpecs({
  limit = 100,
  offset = 0,
  isActive = true,
  supplierName,
  category,
}: {
  limit?: number;
  offset?: number;
  isActive?: boolean;
  supplierName?: string;
  category?: string;
} = {}): Promise<Spec[]> {
  try {
    let query = db
      .select()
      .from(spec)
      .where(eq(spec.isActive, isActive))
      .orderBy(desc(spec.updatedAt))
      .limit(limit)
      .offset(offset);

    const conditions = [eq(spec.isActive, isActive)];

    if (supplierName) {
      conditions.push(ilike(spec.supplierName, `%${supplierName}%`));
    }

    if (category) {
      conditions.push(eq(spec.category, category));
    }

    if (conditions.length > 1) {
      query = db
        .select()
        .from(spec)
        .where(and(...conditions))
        .orderBy(desc(spec.updatedAt))
        .limit(limit)
        .offset(offset);
    }

    return await query;
  } catch (error) {
    console.error('Failed to get specs from database:', error);
    throw error;
  }
}

export async function updateSpec({
  id,
  name,
  supplierName,
  description,
  primaryFunction,
  category,
}: {
  id: string;
  name?: string;
  supplierName?: string;
  description?: string;
  primaryFunction?: string;
  category?: string;
}): Promise<Spec> {
  try {
    const updateData: any = { updatedAt: new Date() };

    if (name) updateData.name = name;
    if (supplierName) updateData.supplierName = supplierName;
    if (description) updateData.description = description;
    if (primaryFunction) updateData.primaryFunction = primaryFunction;
    if (category) updateData.category = category;

    const [updatedSpec] = await db
      .update(spec)
      .set(updateData)
      .where(eq(spec.id, id))
      .returning();

    return updatedSpec;
  } catch (error) {
    console.error('Failed to update spec in database:', error);
    throw error;
  }
}

export async function deleteSpec({ id }: { id: string }): Promise<void> {
  try {
    await db.delete(spec).where(eq(spec.id, id));
  } catch (error) {
    console.error('Failed to delete spec from database:', error);
    throw error;
  }
}

export async function updateSpecStats({
  id,
  fileCount,
  totalSizeBytes,
}: {
  id: string;
  fileCount: number;
  totalSizeBytes: number;
}): Promise<void> {
  try {
    await db
      .update(spec)
      .set({
        fileCount,
        totalSizeBytes: totalSizeBytes.toString(),
        lastProcessedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(spec.id, id));
  } catch (error) {
    console.error('Failed to update spec stats in database:', error);
    throw error;
  }
}

// ========================================
// SPEC FILE MANAGEMENT QUERIES
// ========================================

export async function createSpecFile({
  specId,
  filename,
  originalFilename,
  fileUrl,
  fileSize,
  contentType,
  documentType,
}: {
  specId: string;
  filename: string;
  originalFilename: string;
  fileUrl: string;
  fileSize: number;
  contentType: string;
  documentType?: string;
}): Promise<SpecFile> {
  try {
    const [newFile] = await db
      .insert(specFile)
      .values({
        specId,
        filename,
        originalFilename,
        fileUrl,
        fileSize: fileSize.toString(),
        contentType,
        documentType,
        processingStatus: 'pending',
        uploadedAt: new Date(),
      })
      .returning();
    return newFile;
  } catch (error) {
    console.error('Failed to create spec file in database:', error);
    throw error;
  }
}

export async function getSpecFilesBySpecId({
  specId,
}: {
  specId: string;
}): Promise<SpecFile[]> {
  try {
    return await db
      .select()
      .from(specFile)
      .where(eq(specFile.specId, specId))
      .orderBy(desc(specFile.uploadedAt));
  } catch (error) {
    console.error('Failed to get spec files by spec id from database:', error);
    throw error;
  }
}

export async function getSpecFileById({
  id,
}: { id: string }): Promise<SpecFile | null> {
  try {
    const [file] = await db.select().from(specFile).where(eq(specFile.id, id));
    return file || null;
  } catch (error) {
    console.error('Failed to get spec file by id from database:', error);
    throw error;
  }
}

export async function updateSpecFileProcessingStatus({
  id,
  status,
  extractedText,
  chunkCount,
  errorMessage,
}: {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  extractedText?: string;
  chunkCount?: number;
  errorMessage?: string;
}): Promise<SpecFile> {
  try {
    const updateData: any = {
      processingStatus: status,
      processedAt: new Date(),
    };

    if (extractedText) updateData.extractedText = extractedText;
    if (chunkCount !== undefined) updateData.chunkCount = chunkCount;
    if (errorMessage) updateData.errorMessage = errorMessage;

    const [updatedFile] = await db
      .update(specFile)
      .set(updateData)
      .where(eq(specFile.id, id))
      .returning();

    return updatedFile;
  } catch (error) {
    console.error(
      'Failed to update spec file processing status in database:',
      error,
    );
    throw error;
  }
}

export async function deleteSpecFile({ id }: { id: string }): Promise<void> {
  try {
    await db.delete(specFile).where(eq(specFile.id, id));
  } catch (error) {
    console.error('Failed to delete spec file from database:', error);
    throw error;
  }
}

export async function getSpecFilesByProcessingStatus({
  status,
  limit = 100,
}: {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  limit?: number;
}): Promise<SpecFile[]> {
  try {
    return await db
      .select()
      .from(specFile)
      .where(eq(specFile.processingStatus, status))
      .orderBy(asc(specFile.uploadedAt))
      .limit(limit);
  } catch (error) {
    console.error(
      'Failed to get spec files by processing status from database:',
      error,
    );
    throw error;
  }
}

// ========================================
// SPEC FILE CHUNK MANAGEMENT QUERIES
// ========================================

export async function saveSpecFileChunks(
  chunks: NewSpecFileChunk[],
): Promise<void> {
  try {
    await db.insert(specFileChunk).values(chunks);
  } catch (error) {
    console.error('Failed to save spec file chunks in database:', error);
    throw error;
  }
}

export async function getSpecFileChunksBySpecId({
  specId,
}: {
  specId: string;
}): Promise<SpecFileChunk[]> {
  try {
    return await db
      .select()
      .from(specFileChunk)
      .where(eq(specFileChunk.specId, specId))
      .orderBy(asc(specFileChunk.chunkIndex));
  } catch (error) {
    console.error(
      'Failed to get spec file chunks by spec id from database:',
      error,
    );
    throw error;
  }
}

export async function getSpecFileChunksByFileId({
  fileId,
}: {
  fileId: string;
}): Promise<SpecFileChunk[]> {
  try {
    return await db
      .select()
      .from(specFileChunk)
      .where(eq(specFileChunk.specFileId, fileId))
      .orderBy(asc(specFileChunk.chunkIndex));
  } catch (error) {
    console.error(
      'Failed to get spec file chunks by file id from database:',
      error,
    );
    throw error;
  }
}

export async function deleteSpecFileChunksByFileId({
  fileId,
}: {
  fileId: string;
}): Promise<void> {
  try {
    await db.delete(specFileChunk).where(eq(specFileChunk.specFileId, fileId));
  } catch (error) {
    console.error(
      'Failed to delete spec file chunks by file id from database:',
      error,
    );
    throw error;
  }
}

export async function deleteSpecFileChunksBySpecId({
  specId,
}: {
  specId: string;
}): Promise<void> {
  try {
    await db.delete(specFileChunk).where(eq(specFileChunk.specId, specId));
  } catch (error) {
    console.error(
      'Failed to delete spec file chunks by spec id from database:',
      error,
    );
    throw error;
  }
}

// ========================================
// SEMANTIC SEARCH QUERIES
// ========================================

export async function semanticSearchSpecs({
  queryEmbedding,
  limit = 10,
  specIds,
  similarityThreshold = 0.1,
}: {
  queryEmbedding: number[];
  limit?: number;
  specIds?: string[];
  similarityThreshold?: number;
}): Promise<
  Array<SpecFileChunk & { similarity: number; spec: Spec; file: SpecFile }>
> {
  try {
    const vectorString = `[${queryEmbedding.join(',')}]`;

    // Build conditions array
    const conditions = [
      isNotNull(specFileChunk.embedding),
      eq(spec.isActive, true),
      eq(specFile.processingStatus, 'completed'),
      sql`1 - (${specFileChunk.embedding} <=> ${vectorString}::vector) > ${similarityThreshold}`,
    ];

    // Add spec ID filter if provided
    if (specIds && specIds.length > 0) {
      conditions.push(inArray(specFileChunk.specId, specIds));
    }

    const query = db
      .select({
        // SpecFileChunk fields
        id: specFileChunk.id,
        specFileId: specFileChunk.specFileId,
        specId: specFileChunk.specId,
        chunkIndex: specFileChunk.chunkIndex,
        content: specFileChunk.content,
        embedding: specFileChunk.embedding,
        tokenCount: specFileChunk.tokenCount,
        metadata: specFileChunk.metadata,
        createdAt: specFileChunk.createdAt,
        // Similarity score
        similarity: sql<number>`1 - (${specFileChunk.embedding} <=> ${vectorString}::vector)`,
        // Spec fields
        spec: {
          id: spec.id,
          name: spec.name,
          supplierName: spec.supplierName,
          description: spec.description,
          primaryFunction: spec.primaryFunction,
          category: spec.category,
          isActive: spec.isActive,
          createdAt: spec.createdAt,
          updatedAt: spec.updatedAt,
          lastProcessedAt: spec.lastProcessedAt,
          fileCount: spec.fileCount,
          totalSizeBytes: spec.totalSizeBytes,
        },
        // File fields
        file: {
          id: specFile.id,
          specId: specFile.specId,
          filename: specFile.filename,
          originalFilename: specFile.originalFilename,
          fileUrl: specFile.fileUrl,
          fileSize: specFile.fileSize,
          contentType: specFile.contentType,
          documentType: specFile.documentType,
          processingStatus: specFile.processingStatus,
          extractedText: specFile.extractedText,
          chunkCount: specFile.chunkCount,
          uploadedAt: specFile.uploadedAt,
          processedAt: specFile.processedAt,
          errorMessage: specFile.errorMessage,
        },
      })
      .from(specFileChunk)
      .innerJoin(spec, eq(specFileChunk.specId, spec.id))
      .innerJoin(specFile, eq(specFileChunk.specFileId, specFile.id))
      .where(and(...conditions))
      .orderBy(sql`${specFileChunk.embedding} <=> ${vectorString}::vector`)
      .limit(limit);

    return await query;
  } catch (error) {
    console.error('Failed to perform semantic search on specs:', error);
    throw error;
  }
}

export async function semanticSearchSpecific({
  queryEmbedding,
  specId,
  limit = 10,
  similarityThreshold = 0.1,
}: {
  queryEmbedding: number[];
  specId: string;
  limit?: number;
  similarityThreshold?: number;
}): Promise<Array<SpecFileChunk & { similarity: number; file: SpecFile }>> {
  try {
    const vectorString = `[${queryEmbedding.join(',')}]`;

    const results = await db
      .select({
        // SpecFileChunk fields
        id: specFileChunk.id,
        specFileId: specFileChunk.specFileId,
        specId: specFileChunk.specId,
        chunkIndex: specFileChunk.chunkIndex,
        content: specFileChunk.content,
        embedding: specFileChunk.embedding,
        tokenCount: specFileChunk.tokenCount,
        metadata: specFileChunk.metadata,
        createdAt: specFileChunk.createdAt,
        // Similarity score
        similarity: sql<number>`1 - (${specFileChunk.embedding} <=> ${vectorString}::vector)`,
        // File fields
        file: {
          id: specFile.id,
          specId: specFile.specId,
          filename: specFile.filename,
          originalFilename: specFile.originalFilename,
          fileUrl: specFile.fileUrl,
          fileSize: specFile.fileSize,
          contentType: specFile.contentType,
          documentType: specFile.documentType,
          processingStatus: specFile.processingStatus,
          extractedText: specFile.extractedText,
          chunkCount: specFile.chunkCount,
          uploadedAt: specFile.uploadedAt,
          processedAt: specFile.processedAt,
          errorMessage: specFile.errorMessage,
        },
      })
      .from(specFileChunk)
      .innerJoin(specFile, eq(specFileChunk.specFileId, specFile.id))
      .where(
        and(
          eq(specFileChunk.specId, specId),
          isNotNull(specFileChunk.embedding),
          eq(specFile.processingStatus, 'completed'),
          sql`1 - (${specFileChunk.embedding} <=> ${vectorString}::vector) > ${similarityThreshold}`,
        ),
      )
      .orderBy(sql`${specFileChunk.embedding} <=> ${vectorString}::vector`)
      .limit(limit);

    return results;
  } catch (error) {
    console.error('Failed to perform semantic search on specific spec:', error);
    throw error;
  }
}

// ========================================
// SPEC METADATA QUERIES
// ========================================

export async function createOrUpdateSpecMetadata({
  specId,
  metadata,
}: {
  specId: string;
  metadata: Partial<NewSpecMetadata>;
}): Promise<SpecMetadata> {
  try {
    const metadataWithDefaults = {
      specId,
      ...metadata,
      lastUpdated: new Date(),
    };

    const [result] = await db
      .insert(specMetadata)
      .values(metadataWithDefaults)
      .onConflictDoUpdate({
        target: specMetadata.specId,
        set: {
          ...metadata,
          lastUpdated: new Date(),
        },
      })
      .returning();

    return result;
  } catch (error) {
    console.error(
      'Failed to create or update spec metadata in database:',
      error,
    );
    throw error;
  }
}

export async function getSpecMetadataBySpecId({
  specId,
}: {
  specId: string;
}): Promise<SpecMetadata | null> {
  try {
    const [metadata] = await db
      .select()
      .from(specMetadata)
      .where(eq(specMetadata.specId, specId));
    return metadata || null;
  } catch (error) {
    console.error(
      'Failed to get spec metadata by spec id from database:',
      error,
    );
    throw error;
  }
}

export async function searchSpecsByMetadata({
  allergens,
  certifications,
  nutritionalCriteria,
  limit = 50,
}: {
  allergens?: string[];
  certifications?: string[];
  nutritionalCriteria?: {
    minProtein?: number;
    maxProtein?: number;
    minFat?: number;
    maxFat?: number;
    minCarbs?: number;
    maxCarbs?: number;
  };
  limit?: number;
}): Promise<Array<{ spec: Spec; metadata: SpecMetadata }>> {
  try {
    const conditions = [eq(spec.isActive, true)];

    // Allergen filters
    if (allergens && allergens.length > 0) {
      const allergenConditions = allergens
        .map((allergen) => {
          switch (allergen.toLowerCase()) {
            case 'dairy':
              return eq(specMetadata.allergenDairy, false);
            case 'gluten':
              return eq(specMetadata.allergenGluten, false);
            case 'nuts':
              return eq(specMetadata.allergenTreeNuts, false);
            case 'soy':
              return eq(specMetadata.allergenSoy, false);
            case 'eggs':
              return eq(specMetadata.allergenEggs, false);
            default:
              return null;
          }
        })
        .filter(
          (condition): condition is NonNullable<typeof condition> =>
            condition !== null,
        );

      if (allergenConditions.length > 0) {
        conditions.push(...allergenConditions);
      }
    }

    // Certification filters
    if (certifications && certifications.length > 0) {
      const certificationConditions = certifications
        .map((cert) => {
          switch (cert.toLowerCase()) {
            case 'organic':
              return eq(specMetadata.isOrganic, true);
            case 'non-gmo':
              return eq(specMetadata.isNonGmo, true);
            case 'kosher':
              return eq(specMetadata.isKosher, true);
            case 'halal':
              return eq(specMetadata.isHalal, true);
            case 'gluten-free':
              return eq(specMetadata.isGlutenFree, true);
            case 'vegan':
              return eq(specMetadata.isVegan, true);
            default:
              return null;
          }
        })
        .filter(
          (condition): condition is NonNullable<typeof condition> =>
            condition !== null,
        );

      if (certificationConditions.length > 0) {
        conditions.push(...certificationConditions);
      }
    }

    // Nutritional criteria
    if (nutritionalCriteria) {
      if (nutritionalCriteria.minProtein) {
        conditions.push(
          gte(
            specMetadata.proteinPercent,
            nutritionalCriteria.minProtein.toString(),
          ),
        );
      }
      if (nutritionalCriteria.maxProtein) {
        conditions.push(
          lt(
            specMetadata.proteinPercent,
            nutritionalCriteria.maxProtein.toString(),
          ),
        );
      }
      if (nutritionalCriteria.minFat) {
        conditions.push(
          gte(specMetadata.fatPercent, nutritionalCriteria.minFat.toString()),
        );
      }
      if (nutritionalCriteria.maxFat) {
        conditions.push(
          lt(specMetadata.fatPercent, nutritionalCriteria.maxFat.toString()),
        );
      }
      if (nutritionalCriteria.minCarbs) {
        conditions.push(
          gte(
            specMetadata.carbsPercent,
            nutritionalCriteria.minCarbs.toString(),
          ),
        );
      }
      if (nutritionalCriteria.maxCarbs) {
        conditions.push(
          lt(
            specMetadata.carbsPercent,
            nutritionalCriteria.maxCarbs.toString(),
          ),
        );
      }
    }

    const results = await db
      .select({
        spec: {
          id: spec.id,
          name: spec.name,
          supplierName: spec.supplierName,
          description: spec.description,
          primaryFunction: spec.primaryFunction,
          category: spec.category,
          isActive: spec.isActive,
          createdAt: spec.createdAt,
          updatedAt: spec.updatedAt,
          lastProcessedAt: spec.lastProcessedAt,
          fileCount: spec.fileCount,
          totalSizeBytes: spec.totalSizeBytes,
        },
        metadata: specMetadata,
      })
      .from(spec)
      .innerJoin(specMetadata, eq(spec.id, specMetadata.specId))
      .where(and(...conditions))
      .orderBy(desc(spec.updatedAt))
      .limit(limit);

    return results;
  } catch (error) {
    console.error('Failed to search specs by metadata:', error);
    throw error;
  }
}

// ========================================
// SPEC KEY INGREDIENTS QUERIES
// ========================================

export async function saveSpecKeyIngredients(
  ingredients: NewSpecKeyIngredients[],
): Promise<void> {
  try {
    await db.insert(specKeyIngredients).values(ingredients);
  } catch (error) {
    console.error('Failed to save spec key ingredients in database:', error);
    throw error;
  }
}

export async function getSpecKeyIngredientsBySpecId({
  specId,
}: {
  specId: string;
}): Promise<SpecKeyIngredients[]> {
  try {
    return await db
      .select()
      .from(specKeyIngredients)
      .where(eq(specKeyIngredients.specId, specId))
      .orderBy(
        desc(specKeyIngredients.isPrimary),
        desc(specKeyIngredients.percentage),
      );
  } catch (error) {
    console.error(
      'Failed to get spec key ingredients by spec id from database:',
      error,
    );
    throw error;
  }
}

export async function deleteSpecKeyIngredientsBySpecId({
  specId,
}: {
  specId: string;
}): Promise<void> {
  try {
    await db
      .delete(specKeyIngredients)
      .where(eq(specKeyIngredients.specId, specId));
  } catch (error) {
    console.error(
      'Failed to delete spec key ingredients by spec id from database:',
      error,
    );
    throw error;
  }
}

// ========================================
// SEARCH ANALYTICS QUERIES
// ========================================

export async function logSpecSearch({
  query,
  searchType,
  specId,
  resultCount,
  responseTime,
  wasSuccessful = true,
  errorMessage,
}: {
  query: string;
  searchType: 'spec_specific' | 'cross_spec' | 'compliance' | 'discovery';
  specId?: string;
  resultCount: number;
  responseTime: number;
  wasSuccessful?: boolean;
  errorMessage?: string;
}): Promise<void> {
  try {
    await db.insert(specSearchLog).values({
      query,
      searchType,
      specId,
      resultCount,
      responseTime,
      wasSuccessful,
      errorMessage,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to log spec search in database:', error);
    // Don't throw error for logging failures
  }
}

export async function getSearchAnalytics({
  limit = 100,
  days = 7,
}: {
  limit?: number;
  days?: number;
}): Promise<SpecSearchLog[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return await db
      .select()
      .from(specSearchLog)
      .where(gte(specSearchLog.createdAt, cutoffDate))
      .orderBy(desc(specSearchLog.createdAt))
      .limit(limit);
  } catch (error) {
    console.error('Failed to get search analytics from database:', error);
    throw error;
  }
}

// ========================================
// UTILITY QUERIES
// ========================================

export async function getSpecWithFilesAndMetadata({
  specId,
}: {
  specId: string;
}): Promise<{
  spec: Spec;
  files: SpecFile[];
  metadata: SpecMetadata | null;
  keyIngredients: SpecKeyIngredients[];
} | null> {
  try {
    const [specData, filesData, metadataData, ingredientsData] =
      await Promise.all([
        getSpecById({ id: specId }),
        getSpecFilesBySpecId({ specId }),
        getSpecMetadataBySpecId({ specId }),
        getSpecKeyIngredientsBySpecId({ specId }),
      ]);

    if (!specData) {
      return null;
    }

    return {
      spec: specData,
      files: filesData,
      metadata: metadataData,
      keyIngredients: ingredientsData,
    };
  } catch (error) {
    console.error('Failed to get spec with files and metadata:', error);
    throw error;
  }
}

export async function getSpecsWithMetadata({
  limit = 50,
  offset = 0,
}: {
  limit?: number;
  offset?: number;
}): Promise<Array<{ spec: Spec; metadata: SpecMetadata | null }>> {
  try {
    const results = await db
      .select({
        spec: {
          id: spec.id,
          name: spec.name,
          supplierName: spec.supplierName,
          description: spec.description,
          primaryFunction: spec.primaryFunction,
          category: spec.category,
          isActive: spec.isActive,
          createdAt: spec.createdAt,
          updatedAt: spec.updatedAt,
          lastProcessedAt: spec.lastProcessedAt,
          fileCount: spec.fileCount,
          totalSizeBytes: spec.totalSizeBytes,
        },
        metadata: specMetadata,
      })
      .from(spec)
      .leftJoin(specMetadata, eq(spec.id, specMetadata.specId))
      .where(eq(spec.isActive, true))
      .orderBy(desc(spec.updatedAt))
      .limit(limit)
      .offset(offset);

    return results;
  } catch (error) {
    console.error('Failed to get specs with metadata:', error);
    throw error;
  }
}

export async function getSpecStatistics(): Promise<{
  totalSpecs: number;
  totalFiles: number;
  totalChunks: number;
  processingStats: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
}> {
  try {
    const [
      totalSpecs,
      totalFiles,
      totalChunks,
      pendingFiles,
      processingFiles,
      completedFiles,
      failedFiles,
    ] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(spec)
        .where(eq(spec.isActive, true)),
      db.select({ count: sql<number>`count(*)` }).from(specFile),
      db.select({ count: sql<number>`count(*)` }).from(specFileChunk),
      db
        .select({ count: sql<number>`count(*)` })
        .from(specFile)
        .where(eq(specFile.processingStatus, 'pending')),
      db
        .select({ count: sql<number>`count(*)` })
        .from(specFile)
        .where(eq(specFile.processingStatus, 'processing')),
      db
        .select({ count: sql<number>`count(*)` })
        .from(specFile)
        .where(eq(specFile.processingStatus, 'completed')),
      db
        .select({ count: sql<number>`count(*)` })
        .from(specFile)
        .where(eq(specFile.processingStatus, 'failed')),
    ]);

    return {
      totalSpecs: totalSpecs[0].count,
      totalFiles: totalFiles[0].count,
      totalChunks: totalChunks[0].count,
      processingStats: {
        pending: pendingFiles[0].count,
        processing: processingFiles[0].count,
        completed: completedFiles[0].count,
        failed: failedFiles[0].count,
      },
    };
  } catch (error) {
    console.error('Failed to get spec statistics:', error);
    throw error;
  }
}
