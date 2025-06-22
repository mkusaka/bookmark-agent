CREATE TABLE "bookmark_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bookmark_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment" text,
	"description" text,
	"url" text NOT NULL,
	"domain" text NOT NULL,
	"bookmarked_at" timestamp NOT NULL,
	"bookmark_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"entry_id" uuid
);
--> statement-breakpoint
CREATE TABLE "entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"canonical_url" text NOT NULL,
	"root_url" text NOT NULL,
	"summary" text,
	"domain" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "entries_canonical_url_unique" UNIQUE("canonical_url")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_label_unique" UNIQUE("label")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"hatena_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_hatena_id_unique" UNIQUE("hatena_id")
);
--> statement-breakpoint
ALTER TABLE "bookmark_tags" ADD CONSTRAINT "bookmark_tags_bookmark_id_bookmarks_id_fk" FOREIGN KEY ("bookmark_id") REFERENCES "public"."bookmarks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmark_tags" ADD CONSTRAINT "bookmark_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmark_tags" ADD CONSTRAINT "bookmark_tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookmark_tags_bookmark_idx" ON "bookmark_tags" USING btree ("bookmark_id");--> statement-breakpoint
CREATE INDEX "bookmark_tags_tag_idx" ON "bookmark_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "bookmark_tags_user_idx" ON "bookmark_tags" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bookmark_tags_unique" ON "bookmark_tags" USING btree ("bookmark_id","tag_id");--> statement-breakpoint
CREATE INDEX "bookmarks_user_idx" ON "bookmarks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bookmarks_domain_idx" ON "bookmarks" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "bookmarks_bookmarked_at_idx" ON "bookmarks" USING btree ("bookmarked_at");--> statement-breakpoint
CREATE INDEX "bookmarks_comment_trgm_idx" ON "bookmarks" USING gin ("comment" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "bookmarks_description_trgm_idx" ON "bookmarks" USING gin ("description" gin_trgm_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "bookmarks_user_url_unique" ON "bookmarks" USING btree ("user_id","url");--> statement-breakpoint
CREATE INDEX "entries_domain_idx" ON "entries" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "entries_title_trgm_idx" ON "entries" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "entries_summary_trgm_idx" ON "entries" USING gin ("summary" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "tags_label_idx" ON "tags" USING btree ("label");