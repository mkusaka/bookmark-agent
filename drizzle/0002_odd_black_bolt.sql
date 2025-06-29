ALTER TABLE "bookmarks" ADD COLUMN "normalized_domain" text;--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN "normalized_domain" text;--> statement-breakpoint
CREATE INDEX "bookmarks_normalized_domain_idx" ON "bookmarks" USING btree ("normalized_domain");--> statement-breakpoint
CREATE INDEX "entries_normalized_domain_idx" ON "entries" USING btree ("normalized_domain");