CREATE TABLE "leaderboard_entry" (
	"company_id" text PRIMARY KEY NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"company_level" numeric NOT NULL,
	"company_xp" numeric NOT NULL,
	"reputation" numeric NOT NULL,
	"capital" numeric NOT NULL,
	"customers_served" numeric NOT NULL,
	"successful_repairs" numeric NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "season_progress" (
	"company_id" text NOT NULL,
	"season_key" text NOT NULL,
	"season_level" numeric NOT NULL,
	"season_points" numeric NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leaderboard_entry" ADD CONSTRAINT "leaderboard_entry_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_progress" ADD CONSTRAINT "season_progress_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "leaderboard_level_idx" ON "leaderboard_entry" USING btree ("company_level" DESC NULLS LAST,"company_xp" DESC NULLS LAST,"reputation" DESC NULLS LAST,"company_id");--> statement-breakpoint
CREATE INDEX "leaderboard_reputation_idx" ON "leaderboard_entry" USING btree ("reputation" DESC NULLS LAST,"company_level" DESC NULLS LAST,"successful_repairs" DESC NULLS LAST,"company_id");--> statement-breakpoint
CREATE INDEX "leaderboard_capital_idx" ON "leaderboard_entry" USING btree ("capital" DESC NULLS LAST,"company_id");--> statement-breakpoint
CREATE INDEX "leaderboard_customers_idx" ON "leaderboard_entry" USING btree ("customers_served" DESC NULLS LAST,"successful_repairs" DESC NULLS LAST,"company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "season_company_unique" ON "season_progress" USING btree ("season_key","company_id");