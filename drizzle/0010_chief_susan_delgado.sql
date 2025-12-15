CREATE TABLE "gemini_bookmark_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"bookmark_id" uuid NOT NULL,
	"file_search_store_name" text NOT NULL,
	"document_name" text NOT NULL,
	"content_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gemini_bookmark_documents" ADD CONSTRAINT "gemini_bookmark_documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gemini_bookmark_documents" ADD CONSTRAINT "gemini_bookmark_documents_bookmark_id_bookmarks_id_fk" FOREIGN KEY ("bookmark_id") REFERENCES "public"."bookmarks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "gemini_bookmark_documents_bookmark_unique" ON "gemini_bookmark_documents" USING btree ("bookmark_id");--> statement-breakpoint
CREATE UNIQUE INDEX "gemini_bookmark_documents_store_document_unique" ON "gemini_bookmark_documents" USING btree ("file_search_store_name","document_name");--> statement-breakpoint
CREATE INDEX "gemini_bookmark_documents_user_idx" ON "gemini_bookmark_documents" USING btree ("user_id");