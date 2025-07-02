DROP INDEX "bookmarks_domain_idx";--> statement-breakpoint
CREATE INDEX "bookmarks_url_trgm_idx" ON "bookmarks" USING gin ("url" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "bookmarks_markdown_content_trgm_idx" ON "bookmarks" USING gin ("markdown_content" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "bookmarks_title_idx" ON "bookmarks" USING btree ("title");--> statement-breakpoint
CREATE INDEX "bookmarks_user_bookmarked_at_idx" ON "bookmarks" USING btree ("user_id","bookmarked_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "bookmarks_bookmarked_at_brin_idx" ON "bookmarks" USING brin ("bookmarked_at");