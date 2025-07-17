-- ========================================
-- SPEC-CENTRIC SCHEMA REVOLUTION
-- Drop all existing tables and create new supplier specification intelligence platform
-- ========================================

-- Drop all existing tables and constraints
DROP TABLE IF EXISTS "document_chunks" CASCADE;
DROP TABLE IF EXISTS "UserFile" CASCADE;
DROP TABLE IF EXISTS "timeline" CASCADE;
DROP TABLE IF EXISTS "Suggestion" CASCADE;
DROP TABLE IF EXISTS "Document" CASCADE;
DROP TABLE IF EXISTS "Vote_v2" CASCADE;
DROP TABLE IF EXISTS "Vote" CASCADE;
DROP TABLE IF EXISTS "Message_v2" CASCADE;
DROP TABLE IF EXISTS "Message" CASCADE;
DROP TABLE IF EXISTS "Chat" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Ensure pgvector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- ========================================
-- CORE SPEC TABLES
-- ========================================

-- Primary spec table - represents ingredient specifications
CREATE TABLE IF NOT EXISTS "Spec" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(500) NOT NULL UNIQUE,
	"supplier_name" varchar(255),
	"description" text,
	"primary_function" varchar(100),
	"category" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_processed_at" timestamp,
	"file_count" integer DEFAULT 0 NOT NULL,
	"total_size_bytes" numeric DEFAULT '0' NOT NULL
);

-- Files belonging to specs
CREATE TABLE IF NOT EXISTS "SpecFile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"spec_id" uuid NOT NULL,
	"filename" varchar(500) NOT NULL,
	"original_filename" varchar(500) NOT NULL,
	"file_url" text NOT NULL,
	"file_size" numeric NOT NULL,
	"content_type" varchar(100) NOT NULL,
	"document_type" varchar(100),
	"processing_status" varchar DEFAULT 'pending' NOT NULL,
	"extracted_text" text,
	"chunk_count" integer DEFAULT 0 NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"error_message" text
);

-- Document chunks for semantic search
CREATE TABLE IF NOT EXISTS "SpecFileChunk" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"spec_file_id" uuid NOT NULL,
	"spec_id" uuid NOT NULL,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536),
	"token_count" integer,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- ========================================
-- METADATA TABLES
-- ========================================

-- Structured metadata extracted from documents
CREATE TABLE IF NOT EXISTS "SpecMetadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"spec_id" uuid NOT NULL UNIQUE,
	
	-- Allergen Information
	"allergen_dairy" boolean DEFAULT false,
	"allergen_eggs" boolean DEFAULT false,
	"allergen_fish" boolean DEFAULT false,
	"allergen_shellfish" boolean DEFAULT false,
	"allergen_tree_nuts" boolean DEFAULT false,
	"allergen_peanuts" boolean DEFAULT false,
	"allergen_wheat" boolean DEFAULT false,
	"allergen_gluten" boolean DEFAULT false,
	"allergen_soy" boolean DEFAULT false,
	"allergen_sesame" boolean DEFAULT false,
	"allergen_sulfites" boolean DEFAULT false,
	"allergen_mustard" boolean DEFAULT false,
	"allergen_celery" boolean DEFAULT false,
	"allergen_lupin" boolean DEFAULT false,
	"allergen_molluscs" boolean DEFAULT false,
	
	-- Nutritional Information
	"protein_percent" numeric(5,2),
	"fat_percent" numeric(5,2),
	"carbs_percent" numeric(5,2),
	"fiber_percent" numeric(5,2),
	"sugar_percent" numeric(5,2),
	"sodium_mg" numeric(8,2),
	"calories_per_100g" integer,
	
	-- Certifications & Compliance
	"is_organic" boolean DEFAULT false,
	"is_non_gmo" boolean DEFAULT false,
	"is_kosher" boolean DEFAULT false,
	"is_halal" boolean DEFAULT false,
	"is_fair_trade" boolean DEFAULT false,
	"is_gluten_free" boolean DEFAULT false,
	"is_vegan" boolean DEFAULT false,
	"is_vegetarian" boolean DEFAULT false,
	
	-- Regulatory Information
	"fda_approved" boolean DEFAULT false,
	"usa_approved" boolean DEFAULT false,
	"eu_approved" boolean DEFAULT false,
	"canada_approved" boolean DEFAULT false,
	
	-- Physical Properties
	"ph" numeric(4,2),
	"viscosity" numeric(10,2),
	"density" numeric(8,4),
	"melting_point" numeric(6,2),
	"boiling_point" numeric(6,2),
	
	-- Storage & Shelf Life
	"shelf_life_days" integer,
	"storage_temp_min" numeric(6,2),
	"storage_temp_max" numeric(6,2),
	"storage_humidity_max" numeric(5,2),
	"requires_refrigeration" boolean DEFAULT false,
	"requires_freezing" boolean DEFAULT false,
	
	-- Quality & Safety
	"microbial_tested" boolean DEFAULT false,
	"pesticides_residue" boolean DEFAULT false,
	"heavy_metals_tested" boolean DEFAULT false,
	
	-- Extraction & Processing
	"extraction_method" varchar(200),
	"processing_method" varchar(200),
	
	-- Additional metadata
	"color" varchar(100),
	"odor" varchar(100),
	"taste" varchar(100),
	"texture" varchar(100),
	
	-- Tracking
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"data_quality_score" numeric(4,2),
	"extraction_confidence" numeric(4,2)
);

-- Key ingredients extracted from documents
CREATE TABLE IF NOT EXISTS "SpecKeyIngredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"spec_id" uuid NOT NULL,
	"ingredient_name" varchar(255) NOT NULL,
	"percentage" numeric(5,2),
	"is_primary" boolean DEFAULT false,
	"function" varchar(100),
	"cas_number" varchar(50),
	"e_number" varchar(20),
	"extraction_confidence" numeric(4,2),
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- ========================================
-- SEARCH & ANALYTICS TABLES
-- ========================================

-- Search analytics and logging
CREATE TABLE IF NOT EXISTS "SpecSearchLog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"query" text NOT NULL,
	"search_type" varchar NOT NULL,
	"spec_id" uuid,
	"result_count" integer NOT NULL,
	"response_time_ms" integer NOT NULL,
	"was_successful" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- ========================================
-- FOREIGN KEY CONSTRAINTS
-- ========================================

-- SpecFile constraints
DO $$ BEGIN
 ALTER TABLE "SpecFile" ADD CONSTRAINT "SpecFile_spec_id_Spec_id_fk" FOREIGN KEY ("spec_id") REFERENCES "public"."Spec"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- SpecFileChunk constraints
DO $$ BEGIN
 ALTER TABLE "SpecFileChunk" ADD CONSTRAINT "SpecFileChunk_spec_file_id_SpecFile_id_fk" FOREIGN KEY ("spec_file_id") REFERENCES "public"."SpecFile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "SpecFileChunk" ADD CONSTRAINT "SpecFileChunk_spec_id_Spec_id_fk" FOREIGN KEY ("spec_id") REFERENCES "public"."Spec"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- SpecMetadata constraints
DO $$ BEGIN
 ALTER TABLE "SpecMetadata" ADD CONSTRAINT "SpecMetadata_spec_id_Spec_id_fk" FOREIGN KEY ("spec_id") REFERENCES "public"."Spec"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- SpecKeyIngredients constraints
DO $$ BEGIN
 ALTER TABLE "SpecKeyIngredients" ADD CONSTRAINT "SpecKeyIngredients_spec_id_Spec_id_fk" FOREIGN KEY ("spec_id") REFERENCES "public"."Spec"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- SpecSearchLog constraints
DO $$ BEGIN
 ALTER TABLE "SpecSearchLog" ADD CONSTRAINT "SpecSearchLog_spec_id_Spec_id_fk" FOREIGN KEY ("spec_id") REFERENCES "public"."Spec"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Spec table indexes
CREATE INDEX IF NOT EXISTS "spec_name_idx" ON "Spec" ("name");
CREATE INDEX IF NOT EXISTS "spec_supplier_idx" ON "Spec" ("supplier_name");
CREATE INDEX IF NOT EXISTS "spec_category_idx" ON "Spec" ("category");
CREATE INDEX IF NOT EXISTS "spec_active_idx" ON "Spec" ("is_active");

-- SpecFile table indexes
CREATE INDEX IF NOT EXISTS "spec_file_spec_id_idx" ON "SpecFile" ("spec_id");
CREATE INDEX IF NOT EXISTS "spec_file_status_idx" ON "SpecFile" ("processing_status");
CREATE INDEX IF NOT EXISTS "spec_file_type_idx" ON "SpecFile" ("document_type");
CREATE INDEX IF NOT EXISTS "spec_file_uploaded_idx" ON "SpecFile" ("uploaded_at");

-- SpecFileChunk table indexes
CREATE INDEX IF NOT EXISTS "spec_file_chunk_file_id_idx" ON "SpecFileChunk" ("spec_file_id");
CREATE INDEX IF NOT EXISTS "spec_file_chunk_spec_id_idx" ON "SpecFileChunk" ("spec_id");
CREATE INDEX IF NOT EXISTS "spec_file_chunk_embedding_idx" ON "SpecFileChunk" USING ivfflat ("embedding" vector_cosine_ops);

-- SpecMetadata table indexes
CREATE INDEX IF NOT EXISTS "spec_metadata_spec_id_idx" ON "SpecMetadata" ("spec_id");
CREATE INDEX IF NOT EXISTS "spec_metadata_organic_idx" ON "SpecMetadata" ("is_organic");
CREATE INDEX IF NOT EXISTS "spec_metadata_gluten_free_idx" ON "SpecMetadata" ("is_gluten_free");
CREATE INDEX IF NOT EXISTS "spec_metadata_vegan_idx" ON "SpecMetadata" ("is_vegan");
CREATE INDEX IF NOT EXISTS "spec_metadata_protein_idx" ON "SpecMetadata" ("protein_percent");
CREATE INDEX IF NOT EXISTS "spec_metadata_updated_idx" ON "SpecMetadata" ("last_updated");

-- SpecKeyIngredients table indexes
CREATE INDEX IF NOT EXISTS "spec_ingredients_spec_id_idx" ON "SpecKeyIngredients" ("spec_id");
CREATE INDEX IF NOT EXISTS "spec_ingredients_name_idx" ON "SpecKeyIngredients" ("ingredient_name");
CREATE INDEX IF NOT EXISTS "spec_ingredients_primary_idx" ON "SpecKeyIngredients" ("is_primary");
CREATE INDEX IF NOT EXISTS "spec_ingredients_function_idx" ON "SpecKeyIngredients" ("function");

-- SpecSearchLog table indexes
CREATE INDEX IF NOT EXISTS "spec_search_query_idx" ON "SpecSearchLog" ("query");
CREATE INDEX IF NOT EXISTS "spec_search_type_idx" ON "SpecSearchLog" ("search_type");
CREATE INDEX IF NOT EXISTS "spec_search_spec_id_idx" ON "SpecSearchLog" ("spec_id");
CREATE INDEX IF NOT EXISTS "spec_search_created_idx" ON "SpecSearchLog" ("created_at");

-- ========================================
-- ENUM CONSTRAINT CHECKS
-- ========================================

-- Processing status constraint
DO $$ BEGIN
 ALTER TABLE "SpecFile" ADD CONSTRAINT "SpecFile_processing_status_check" CHECK ("processing_status" IN ('pending', 'processing', 'completed', 'failed'));
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Search type constraint
DO $$ BEGIN
 ALTER TABLE "SpecSearchLog" ADD CONSTRAINT "SpecSearchLog_search_type_check" CHECK ("search_type" IN ('spec_specific', 'cross_spec', 'compliance', 'discovery'));
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

-- Success message
DO $$ BEGIN
    RAISE NOTICE 'Spec-centric schema revolution completed successfully!';
    RAISE NOTICE 'All old tables dropped and new supplier specification intelligence platform created.';
END $$; 