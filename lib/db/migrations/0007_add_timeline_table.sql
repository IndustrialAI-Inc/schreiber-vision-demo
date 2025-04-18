CREATE TABLE IF NOT EXISTS "timeline" (
  "id" text PRIMARY KEY,
  "chat_id" text NOT NULL,
  "is_visible" boolean DEFAULT false NOT NULL,
  "steps" text NOT NULL,
  "last_updated" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "timeline_chat_id_idx" ON "timeline" ("chat_id"); 