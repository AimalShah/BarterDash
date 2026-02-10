CREATE TYPE "public"."account_status" AS ENUM('active', 'suspended', 'banned', 'under_review');--> statement-breakpoint
CREATE TYPE "public"."direct_message_type" AS ENUM('text', 'image', 'product_link');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('push', 'email', 'sms');--> statement-breakpoint
CREATE TYPE "public"."refund_status" AS ENUM('pending', 'approved', 'rejected', 'processing', 'completed');--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"session_id" uuid,
	"event_type" varchar(100) NOT NULL,
	"metadata" json,
	"ip_address" varchar(50),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auto_bids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auction_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"max_amount" numeric(12, 2) NOT NULL,
	"current_proxy_bid" numeric(12, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blocked_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"blocked_id" uuid NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "direct_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"content" text NOT NULL,
	"message_type" "direct_message_type" DEFAULT 'text' NOT NULL,
	"attachment_url" text,
	"product_id" uuid,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"user_id" uuid NOT NULL,
	"notification_type" varchar(100) NOT NULL,
	"push_enabled" boolean DEFAULT true NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"sms_enabled" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price_at_purchase" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"requested_by" uuid,
	"amount" numeric(12, 2) NOT NULL,
	"reason" text NOT NULL,
	"status" "refund_status" DEFAULT 'pending' NOT NULL,
	"stripe_refund_id" varchar(255),
	"admin_notes" text,
	"approved_by" uuid,
	"approved_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_watchlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stream_id" uuid,
	"product_id" uuid,
	"added_at" timestamp DEFAULT now() NOT NULL,
	"notification_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "messages" CASCADE;--> statement-breakpoint
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_participant1_id_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_participant2_id_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "reports" DROP CONSTRAINT "reports_resolved_by_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "reports" DROP CONSTRAINT "reports_reporter_id_profiles_id_fk";
--> statement-breakpoint
DROP INDEX "conversations_participant1_idx";--> statement-breakpoint
DROP INDEX "conversations_participant2_idx";--> statement-breakpoint
DROP INDEX "conversations_participants_idx";--> statement-breakpoint
ALTER TABLE "reports" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "auctions" ADD COLUMN "minimum_bid_increment" numeric(12, 2) DEFAULT '1.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "auctions" ADD COLUMN "reserve_met" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "auctions" ADD COLUMN "winner_notified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "added_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "participant_ids" uuid[] NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "last_message_id" uuid;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "channel" "notification_channel" DEFAULT 'push' NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "delivered_at" timestamp;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "clicked_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "platform_fee_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "estimated_delivery" timestamp;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "account_status" "account_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "tutorial_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "reported_user_id" uuid;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "reported_product_id" uuid;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "reported_stream_id" uuid;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "report_type" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "reviewed_by" uuid;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "review_notes" text;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "action_taken" varchar(100);--> statement-breakpoint
ALTER TABLE "seller_details" ADD COLUMN "payout_schedule" varchar(20) DEFAULT 'weekly' NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_details" ADD COLUMN "next_payout_date" timestamp;--> statement-breakpoint
ALTER TABLE "seller_details" ADD COLUMN "terms_accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "streams" ADD COLUMN "recording_url" text;--> statement-breakpoint
ALTER TABLE "streams" ADD COLUMN "peak_viewer_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "streams" ADD COLUMN "total_view_time" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "streams" ADD COLUMN "chat_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_bids" ADD CONSTRAINT "auto_bids_auction_id_auctions_id_fk" FOREIGN KEY ("auction_id") REFERENCES "public"."auctions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_bids" ADD CONSTRAINT "auto_bids_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blocked_id_profiles_id_fk" FOREIGN KEY ("blocked_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_sender_id_profiles_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_requested_by_profiles_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_approved_by_profiles_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_watchlist" ADD CONSTRAINT "user_watchlist_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_watchlist" ADD CONSTRAINT "user_watchlist_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_watchlist" ADD CONSTRAINT "user_watchlist_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_user_time_idx" ON "analytics_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "analytics_event_type_idx" ON "analytics_events" USING btree ("event_type","created_at");--> statement-breakpoint
CREATE INDEX "analytics_session_idx" ON "analytics_events" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auto_bids_unique_idx" ON "auto_bids" USING btree ("auction_id","user_id");--> statement-breakpoint
CREATE INDEX "auto_bids_auction_active_idx" ON "auto_bids" USING btree ("auction_id") WHERE "auto_bids"."is_active" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_block_idx" ON "blocked_users" USING btree ("user_id","blocked_id");--> statement-breakpoint
CREATE INDEX "direct_messages_conversation_idx" ON "direct_messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "direct_messages_sender_idx" ON "direct_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "direct_messages_unread_idx" ON "direct_messages" USING btree ("conversation_id") WHERE "direct_messages"."read_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "notification_preferences_pk" ON "notification_preferences" USING btree ("user_id","notification_type");--> statement-breakpoint
CREATE INDEX "refunds_order_idx" ON "refunds" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "refunds_status_idx" ON "refunds" USING btree ("status");--> statement-breakpoint
CREATE INDEX "user_item_idx" ON "user_watchlist" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "watchlist_user_product_idx" ON "user_watchlist" USING btree ("user_id","product_id");--> statement-breakpoint
CREATE INDEX "watchlist_user_stream_idx" ON "user_watchlist" USING btree ("user_id","stream_id");--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_user_id_profiles_id_fk" FOREIGN KEY ("reported_user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_product_id_products_id_fk" FOREIGN KEY ("reported_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_stream_id_streams_id_fk" FOREIGN KEY ("reported_stream_id") REFERENCES "public"."streams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reviewed_by_profiles_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_profiles_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cart_items_user_idx" ON "cart_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cart_items_expiry_idx" ON "cart_items" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reports_reported_user_idx" ON "reports" USING btree ("reported_user_id");--> statement-breakpoint
CREATE INDEX "conversations_participants_idx" ON "conversations" USING btree ("participant_ids");--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "participant1_id";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "participant2_id";--> statement-breakpoint
ALTER TABLE "reports" DROP COLUMN "reportedType";--> statement-breakpoint
ALTER TABLE "reports" DROP COLUMN "reported_id";--> statement-breakpoint
ALTER TABLE "reports" DROP COLUMN "reason";--> statement-breakpoint
ALTER TABLE "reports" DROP COLUMN "resolved_by";--> statement-breakpoint
ALTER TABLE "reports" DROP COLUMN "resolution_notes";