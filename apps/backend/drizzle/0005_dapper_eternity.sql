CREATE TYPE "public"."escrow_status" AS ENUM('pending', 'held', 'releasing', 'released', 'refunding', 'refunded', 'disputed', 'cancelled');--> statement-breakpoint
CREATE TABLE "escrow_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"buyer_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"platform_fee" numeric(12, 2) NOT NULL,
	"seller_amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'usd' NOT NULL,
	"status" "escrow_status" DEFAULT 'pending' NOT NULL,
	"stripe_payment_intent_id" varchar(255),
	"stripe_transfer_id" varchar(255),
	"stripe_refund_id" varchar(255),
	"held_at" timestamp,
	"released_at" timestamp,
	"refunded_at" timestamp,
	"release_scheduled_at" timestamp,
	"release_reason" varchar(100),
	"refund_reason" text,
	"dispute_id" varchar(255),
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stream_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stream_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"notified" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seller_details" ALTER COLUMN "commission_rate" SET DEFAULT '8.00';--> statement-breakpoint
ALTER TABLE "seller_details" ADD COLUMN "stripe_payouts_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_details" ADD COLUMN "stripe_charges_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "seller_details" ADD COLUMN "stripe_onboarding_complete" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_buyer_id_profiles_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_seller_id_profiles_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_subscriptions" ADD CONSTRAINT "stream_subscriptions_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_subscriptions" ADD CONSTRAINT "stream_subscriptions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "escrow_order_idx" ON "escrow_transactions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "escrow_buyer_idx" ON "escrow_transactions" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "escrow_seller_idx" ON "escrow_transactions" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "escrow_status_idx" ON "escrow_transactions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "stream_subscriptions_unique_idx" ON "stream_subscriptions" USING btree ("stream_id","user_id");--> statement-breakpoint
CREATE INDEX "stream_subscriptions_stream_idx" ON "stream_subscriptions" USING btree ("stream_id");--> statement-breakpoint
CREATE INDEX "stream_subscriptions_user_idx" ON "stream_subscriptions" USING btree ("user_id");