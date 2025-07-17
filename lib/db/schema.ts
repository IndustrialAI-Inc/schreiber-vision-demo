import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  boolean,
  numeric,
  index,
  integer,
  jsonb,
  vector,
  decimal,
  real,
} from 'drizzle-orm/pg-core';
import { type InferInsertModel, relations, sql } from 'drizzle-orm';

// ========================================
// CORE SPEC TABLES
// ========================================

export const spec = pgTable(
  'Spec',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    name: varchar('name', { length: 500 }).notNull().unique(),
    supplierName: varchar('supplier_name', { length: 255 }),
    description: text('description'),
    primaryFunction: varchar('primary_function', { length: 100 }),
    category: varchar('category', { length: 100 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    lastProcessedAt: timestamp('last_processed_at'),
    fileCount: integer('file_count').notNull().default(0),
    totalSizeBytes: numeric('total_size_bytes').notNull().default('0'),
  },
  (table) => ({
    nameIdx: index('spec_name_idx').on(table.name),
    supplierIdx: index('spec_supplier_idx').on(table.supplierName),
    categoryIdx: index('spec_category_idx').on(table.category),
    activeIdx: index('spec_active_idx').on(table.isActive),
  }),
);

export type Spec = InferSelectModel<typeof spec>;
export type NewSpec = InferInsertModel<typeof spec>;

export const specFile = pgTable(
  'SpecFile',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    specId: uuid('spec_id')
      .notNull()
      .references(() => spec.id, { onDelete: 'cascade' }),
    filename: varchar('filename', { length: 500 }).notNull(),
    originalFilename: varchar('original_filename', { length: 500 }).notNull(),
    fileUrl: text('file_url').notNull(),
    fileSize: numeric('file_size').notNull(),
    contentType: varchar('content_type', { length: 100 }).notNull(),
    documentType: varchar('document_type', { length: 100 }), // MSDS, Certificate, Allergen Declaration, etc.
    processingStatus: varchar('processing_status', {
      enum: ['pending', 'processing', 'completed', 'failed'],
    })
      .notNull()
      .default('pending'),
    extractedText: text('extracted_text'),
    chunkCount: integer('chunk_count').notNull().default(0),
    uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
    processedAt: timestamp('processed_at'),
    errorMessage: text('error_message'),
  },
  (table) => ({
    specIdIdx: index('spec_file_spec_id_idx').on(table.specId),
    statusIdx: index('spec_file_status_idx').on(table.processingStatus),
    typeIdx: index('spec_file_type_idx').on(table.documentType),
    uploadedIdx: index('spec_file_uploaded_idx').on(table.uploadedAt),
  }),
);

export type SpecFile = InferSelectModel<typeof specFile>;
export type NewSpecFile = InferInsertModel<typeof specFile>;

export const specFileChunk = pgTable(
  'SpecFileChunk',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    specFileId: uuid('spec_file_id')
      .notNull()
      .references(() => specFile.id, { onDelete: 'cascade' }),
    specId: uuid('spec_id')
      .notNull()
      .references(() => spec.id, { onDelete: 'cascade' }), // Denormalized for fast spec-based search
    chunkIndex: integer('chunk_index').notNull(),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }),
    tokenCount: integer('token_count'),
    metadata: jsonb('metadata').notNull().default('{}'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    specFileIdIdx: index('spec_file_chunk_file_id_idx').on(table.specFileId),
    specIdIdx: index('spec_file_chunk_spec_id_idx').on(table.specId),
    embeddingIdx: index('spec_file_chunk_embedding_idx').using(
      'ivfflat',
      table.embedding.op('vector_cosine_ops'),
    ),
  }),
);

export type SpecFileChunk = InferSelectModel<typeof specFileChunk>;
export type NewSpecFileChunk = InferInsertModel<typeof specFileChunk>;

// ========================================
// METADATA TABLES
// ========================================

export const specMetadata = pgTable(
  'SpecMetadata',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    specId: uuid('spec_id')
      .notNull()
      .references(() => spec.id, { onDelete: 'cascade' })
      .unique(),

    // Allergen Information
    allergenDairy: boolean('allergen_dairy').default(false),
    allergenEggs: boolean('allergen_eggs').default(false),
    allergenFish: boolean('allergen_fish').default(false),
    allergenShellfish: boolean('allergen_shellfish').default(false),
    allergenTreeNuts: boolean('allergen_tree_nuts').default(false),
    allergenPeanuts: boolean('allergen_peanuts').default(false),
    allergenWheat: boolean('allergen_wheat').default(false),
    allergenGluten: boolean('allergen_gluten').default(false),
    allergenSoy: boolean('allergen_soy').default(false),
    allergenSesame: boolean('allergen_sesame').default(false),
    allergenSulfites: boolean('allergen_sulfites').default(false),
    allergenMustard: boolean('allergen_mustard').default(false),
    allergenCelery: boolean('allergen_celery').default(false),
    allergenLupin: boolean('allergen_lupin').default(false),
    allergenMolluscs: boolean('allergen_molluscs').default(false),

    // Nutritional Information
    proteinPercent: decimal('protein_percent', { precision: 5, scale: 2 }),
    fatPercent: decimal('fat_percent', { precision: 5, scale: 2 }),
    carbsPercent: decimal('carbs_percent', { precision: 5, scale: 2 }),
    fiberPercent: decimal('fiber_percent', { precision: 5, scale: 2 }),
    sugarPercent: decimal('sugar_percent', { precision: 5, scale: 2 }),
    sodiumMg: decimal('sodium_mg', { precision: 8, scale: 2 }),
    caloriesPer100g: integer('calories_per_100g'),

    // Certifications & Compliance
    isOrganic: boolean('is_organic').default(false),
    isNonGmo: boolean('is_non_gmo').default(false),
    isKosher: boolean('is_kosher').default(false),
    isHalal: boolean('is_halal').default(false),
    isFairTrade: boolean('is_fair_trade').default(false),
    isGlutenFree: boolean('is_gluten_free').default(false),
    isVegan: boolean('is_vegan').default(false),
    isVegetarian: boolean('is_vegetarian').default(false),

    // Regulatory Information
    fdaApproved: boolean('fda_approved').default(false),
    usaApproved: boolean('usa_approved').default(false),
    euApproved: boolean('eu_approved').default(false),
    canadaApproved: boolean('canada_approved').default(false),

    // Physical Properties
    ph: decimal('ph', { precision: 4, scale: 2 }),
    viscosity: decimal('viscosity', { precision: 10, scale: 2 }),
    density: decimal('density', { precision: 8, scale: 4 }),
    meltingPoint: decimal('melting_point', { precision: 6, scale: 2 }),
    boilingPoint: decimal('boiling_point', { precision: 6, scale: 2 }),

    // Storage & Shelf Life
    shelfLifeDays: integer('shelf_life_days'),
    storageTemperatureMin: decimal('storage_temp_min', {
      precision: 6,
      scale: 2,
    }),
    storageTemperatureMax: decimal('storage_temp_max', {
      precision: 6,
      scale: 2,
    }),
    storageHumidityMax: decimal('storage_humidity_max', {
      precision: 5,
      scale: 2,
    }),
    requiresRefrigeration: boolean('requires_refrigeration').default(false),
    requiresFreezing: boolean('requires_freezing').default(false),

    // Quality & Safety
    microbialTested: boolean('microbial_tested').default(false),
    pesticidesResidue: boolean('pesticides_residue').default(false),
    heavyMetalsTested: boolean('heavy_metals_tested').default(false),

    // Extraction & Processing
    extractionMethod: varchar('extraction_method', { length: 200 }),
    processingMethod: varchar('processing_method', { length: 200 }),

    // Additional metadata
    color: varchar('color', { length: 100 }),
    odor: varchar('odor', { length: 100 }),
    taste: varchar('taste', { length: 100 }),
    texture: varchar('texture', { length: 100 }),

    // Tracking
    lastUpdated: timestamp('last_updated').notNull().defaultNow(),
    dataQualityScore: decimal('data_quality_score', { precision: 4, scale: 2 }),
    extractionConfidence: decimal('extraction_confidence', {
      precision: 4,
      scale: 2,
    }),
  },
  (table) => ({
    specIdIdx: index('spec_metadata_spec_id_idx').on(table.specId),
    organicIdx: index('spec_metadata_organic_idx').on(table.isOrganic),
    glutenFreeIdx: index('spec_metadata_gluten_free_idx').on(
      table.isGlutenFree,
    ),
    veganIdx: index('spec_metadata_vegan_idx').on(table.isVegan),
    proteinIdx: index('spec_metadata_protein_idx').on(table.proteinPercent),
    lastUpdatedIdx: index('spec_metadata_updated_idx').on(table.lastUpdated),
  }),
);

export type SpecMetadata = InferSelectModel<typeof specMetadata>;
export type NewSpecMetadata = InferInsertModel<typeof specMetadata>;

export const specKeyIngredients = pgTable(
  'SpecKeyIngredients',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    specId: uuid('spec_id')
      .notNull()
      .references(() => spec.id, { onDelete: 'cascade' }),
    ingredientName: varchar('ingredient_name', { length: 255 }).notNull(),
    percentage: decimal('percentage', { precision: 5, scale: 2 }),
    isPrimary: boolean('is_primary').default(false),
    function: varchar('function', { length: 100 }), // Preservative, Emulsifier, etc.
    casNumber: varchar('cas_number', { length: 50 }),
    eNumber: varchar('e_number', { length: 20 }),
    extractionConfidence: decimal('extraction_confidence', {
      precision: 4,
      scale: 2,
    }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    specIdIdx: index('spec_ingredients_spec_id_idx').on(table.specId),
    ingredientIdx: index('spec_ingredients_name_idx').on(table.ingredientName),
    primaryIdx: index('spec_ingredients_primary_idx').on(table.isPrimary),
    functionIdx: index('spec_ingredients_function_idx').on(table.function),
  }),
);

export type SpecKeyIngredients = InferSelectModel<typeof specKeyIngredients>;
export type NewSpecKeyIngredients = InferInsertModel<typeof specKeyIngredients>;

// ========================================
// SEARCH & ANALYTICS TABLES
// ========================================

export const specSearchLog = pgTable(
  'SpecSearchLog',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    query: text('query').notNull(),
    searchType: varchar('search_type', {
      enum: ['spec_specific', 'cross_spec', 'compliance', 'discovery'],
    }).notNull(),
    specId: uuid('spec_id').references(() => spec.id), // null for cross-spec searches
    resultCount: integer('result_count').notNull(),
    responseTime: integer('response_time_ms').notNull(),
    wasSuccessful: boolean('was_successful').notNull().default(true),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    queryIdx: index('spec_search_query_idx').on(table.query),
    typeIdx: index('spec_search_type_idx').on(table.searchType),
    specIdIdx: index('spec_search_spec_id_idx').on(table.specId),
    createdIdx: index('spec_search_created_idx').on(table.createdAt),
  }),
);

export type SpecSearchLog = InferSelectModel<typeof specSearchLog>;
export type NewSpecSearchLog = InferInsertModel<typeof specSearchLog>;

// ========================================
// RELATIONS
// ========================================

export const specRelations = relations(spec, ({ many, one }) => ({
  files: many(specFile),
  chunks: many(specFileChunk),
  metadata: one(specMetadata),
  keyIngredients: many(specKeyIngredients),
  searchLogs: many(specSearchLog),
}));

export const specFileRelations = relations(specFile, ({ one, many }) => ({
  spec: one(spec, {
    fields: [specFile.specId],
    references: [spec.id],
  }),
  chunks: many(specFileChunk),
}));

export const specFileChunkRelations = relations(specFileChunk, ({ one }) => ({
  spec: one(spec, {
    fields: [specFileChunk.specId],
    references: [spec.id],
  }),
  file: one(specFile, {
    fields: [specFileChunk.specFileId],
    references: [specFile.id],
  }),
}));

export const specMetadataRelations = relations(specMetadata, ({ one }) => ({
  spec: one(spec, {
    fields: [specMetadata.specId],
    references: [spec.id],
  }),
}));

export const specKeyIngredientsRelations = relations(
  specKeyIngredients,
  ({ one }) => ({
    spec: one(spec, {
      fields: [specKeyIngredients.specId],
      references: [spec.id],
    }),
  }),
);

export const specSearchLogRelations = relations(specSearchLog, ({ one }) => ({
  spec: one(spec, {
    fields: [specSearchLog.specId],
    references: [spec.id],
  }),
}));
