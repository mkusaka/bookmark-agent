CREATE TABLE "ai_session_bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"bookmark_id" uuid NOT NULL,
	"sort_order" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"question" text NOT NULL,
	"response_text" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"model_name" text,
	"external_interaction_id" text,
	"processing_time_ms" integer,
	"started_at" timestamp,
	"completed_at" timestamp,
	"error_message" text,
	"parent_session_id" uuid,
	"user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_session_bookmarks" ADD CONSTRAINT "ai_session_bookmarks_session_id_ai_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."ai_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_session_bookmarks" ADD CONSTRAINT "ai_session_bookmarks_bookmark_id_bookmarks_id_fk" FOREIGN KEY ("bookmark_id") REFERENCES "public"."bookmarks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_sessions" ADD CONSTRAINT "ai_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_session_bookmarks_session_idx" ON "ai_session_bookmarks" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "ai_session_bookmarks_bookmark_idx" ON "ai_session_bookmarks" USING btree ("bookmark_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_session_bookmarks_unique" ON "ai_session_bookmarks" USING btree ("session_id","bookmark_id");--> statement-breakpoint
CREATE INDEX "ai_sessions_type_idx" ON "ai_sessions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "ai_sessions_status_idx" ON "ai_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ai_sessions_created_at_idx" ON "ai_sessions" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "ai_sessions_user_idx" ON "ai_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_sessions_parent_idx" ON "ai_sessions" USING btree ("parent_session_id");--> statement-breakpoint
CREATE INDEX "ai_sessions_created_at_id_idx" ON "ai_sessions" USING btree ("created_at" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE INDEX "ai_sessions_question_trgm_idx" ON "ai_sessions" USING gin ("question" gin_trgm_ops);