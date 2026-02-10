CREATE TYPE "public"."chat_message_type" AS ENUM('user_message', 'system_message', 'auction_update');--> statement-breakpoint
CREATE TYPE "public"."stream_session_state" AS ENUM('initializing', 'active', 'paused', 'ended', 'error');--> statement-breakpoint
CREATE TABLE "agora_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"channel_id" varchar(255) NOT NULL,
	"uid" integer NOT NULL,
	"privileges" json NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stream_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"auction_id" uuid,
	"channel_id" varchar(255) NOT NULL,
	"state" "stream_session_state" DEFAULT 'initializing' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"ended_at" timestamp,
	"viewer_count" integer DEFAULT 0 NOT NULL,
	"metadata" json DEFAULT '{}'::json,
	CONSTRAINT "stream_sessions_channel_id_unique" UNIQUE("channel_id")
);
--> statement-breakpoint
CREATE TABLE "stream_viewers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"left_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "session_id" uuid;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "message_type" "chat_message_type" DEFAULT 'user_message' NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "metadata" json DEFAULT '{}'::json;--> statement-breakpoint
ALTER TABLE "agora_tokens" ADD CONSTRAINT "agora_tokens_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agora_tokens" ADD CONSTRAINT "agora_tokens_session_id_stream_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."stream_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_sessions" ADD CONSTRAINT "stream_sessions_seller_id_profiles_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_sessions" ADD CONSTRAINT "stream_sessions_auction_id_auctions_id_fk" FOREIGN KEY ("auction_id") REFERENCES "public"."auctions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_viewers" ADD CONSTRAINT "stream_viewers_session_id_stream_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."stream_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_viewers" ADD CONSTRAINT "stream_viewers_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agora_tokens_user_session_idx" ON "agora_tokens" USING btree ("user_id","session_id");--> statement-breakpoint
CREATE INDEX "agora_tokens_channel_idx" ON "agora_tokens" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "agora_tokens_expires_idx" ON "agora_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "agora_tokens_active_idx" ON "agora_tokens" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "stream_sessions_seller_idx" ON "stream_sessions" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "stream_sessions_state_idx" ON "stream_sessions" USING btree ("state");--> statement-breakpoint
CREATE INDEX "stream_sessions_created_at_idx" ON "stream_sessions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "stream_viewers_unique_idx" ON "stream_viewers" USING btree ("session_id","user_id");--> statement-breakpoint
CREATE INDEX "stream_viewers_session_idx" ON "stream_viewers" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "stream_viewers_user_idx" ON "stream_viewers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "stream_viewers_active_idx" ON "stream_viewers" USING btree ("session_id","is_active");--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_stream_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."stream_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_messages_session_idx" ON "chat_messages" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "chat_messages_type_idx" ON "chat_messages" USING btree ("message_type");