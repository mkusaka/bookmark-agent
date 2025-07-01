ALTER TABLE "bookmarks" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD COLUMN "canonical_url" text;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD COLUMN "root_url" text;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD COLUMN "normalized_domain" text;--> statement-breakpoint
CREATE INDEX "bookmarks_normalized_domain_idx" ON "bookmarks" USING btree ("normalized_domain");--> statement-breakpoint
CREATE INDEX "bookmarks_title_trgm_idx" ON "bookmarks" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "bookmarks_summary_trgm_idx" ON "bookmarks" USING gin ("summary" gin_trgm_ops);