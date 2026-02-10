ALTER TABLE "profiles" ADD COLUMN "onboarded" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "onboarding_step" varchar(50) DEFAULT 'profile' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "onboarding_completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "interests" json;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "notification_preferences" json DEFAULT '{"streamAlerts":true,"bidAlerts":true,"emailNotifications":true}'::json;--> statement-breakpoint
CREATE INDEX "profiles_onboarded_idx" ON "profiles" USING btree ("onboarded");--> statement-breakpoint
CREATE INDEX "profiles_onboarding_step_idx" ON "profiles" USING btree ("onboarding_step");