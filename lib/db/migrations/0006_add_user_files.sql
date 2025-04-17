CREATE TABLE IF NOT EXISTS "UserFile" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "fileName" text NOT NULL,
  "fileUrl" text NOT NULL,
  "fileType" varchar(64) NOT NULL,
  "fileSize" numeric NOT NULL,
  "userId" uuid NOT NULL,
  "createdAt" timestamp NOT NULL,
  CONSTRAINT "UserFile_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "User" ("id")
);