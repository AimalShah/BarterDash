CREATE TYPE "public"."auction_mode" AS ENUM('normal', 'sudden_death');--> statement-breakpoint
ALTER TABLE "auctions" ADD COLUMN "mode" "auction_mode" DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE "auctions" ADD COLUMN "timer_extensions" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "auctions" ADD COLUMN "max_timer_extensions" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "auctions" ADD COLUMN "original_ends_at" timestamp;--> statement-breakpoint
CREATE INDEX "auctions_ends_at_idx" ON "auctions" USING btree ("ends_at");