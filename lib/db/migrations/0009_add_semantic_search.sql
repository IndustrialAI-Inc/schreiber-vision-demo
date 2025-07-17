-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Table to store document chunks with embeddings
CREATE TABLE IF NOT EXISTS "document_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" uuid NOT NULL,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536), -- OpenAI text-embedding-3-large dimensions
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Foreign key constraint to userFile table
DO $$ BEGIN
 ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_file_id_UserFile_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."UserFile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Index for vector similarity search (cosine distance)
CREATE INDEX IF NOT EXISTS "document_chunks_embedding_idx" ON "document_chunks" USING ivfflat ("embedding" vector_cosine_ops);

-- Index for file lookups
CREATE INDEX IF NOT EXISTS "document_chunks_file_id_idx" ON "document_chunks" ("file_id");

-- Index for metadata searches
CREATE INDEX IF NOT EXISTS "document_chunks_metadata_idx" ON "document_chunks" USING gin ("metadata"); 