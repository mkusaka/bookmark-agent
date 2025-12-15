ALTER TABLE "bookmarks" ADD COLUMN "gemini_file_search_store_name" text;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD COLUMN "gemini_document_name" text;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD COLUMN "gemini_content_hash" text;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD COLUMN "gemini_indexed_at" timestamp;--> statement-breakpoint
UPDATE "bookmarks" AS b
SET
  "gemini_file_search_store_name" = g."file_search_store_name",
  "gemini_document_name" = g."document_name",
  "gemini_content_hash" = g."content_hash",
  "gemini_indexed_at" = g."updated_at"
FROM "gemini_bookmark_documents" AS g
WHERE g."bookmark_id" = b."id";--> statement-breakpoint
DROP TABLE "gemini_bookmark_documents" CASCADE;
