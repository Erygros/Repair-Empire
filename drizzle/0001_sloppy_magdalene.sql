CREATE TABLE "rate_limit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rate_limit_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_case_insensitive_unique" ON "user" USING btree (lower(trim("email")));--> statement-breakpoint
CREATE UNIQUE INDEX "user_username_case_insensitive_unique" ON "user" USING btree (lower(trim("username")));