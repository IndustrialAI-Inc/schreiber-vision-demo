-- Add senderMode column to Message_v2 table
ALTER TABLE "Message_v2" ADD COLUMN IF NOT EXISTS "senderMode" varchar;
