ALTER TABLE "entries" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bookmarks" DROP CONSTRAINT "bookmarks_entry_id_entries_id_fk";
--> statement-breakpoint
DROP TABLE "entries" CASCADE;--> statement-breakpoint
ALTER TABLE "bookmarks" ALTER COLUMN "title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bookmarks" ALTER COLUMN "canonical_url" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bookmarks" ALTER COLUMN "root_url" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bookmarks" ALTER COLUMN "normalized_domain" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bookmarks" DROP COLUMN "entry_id";