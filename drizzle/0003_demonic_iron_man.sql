ALTER TABLE "character" ADD COLUMN "character_model_id" text DEFAULT 'founder_female_01' NOT NULL;
--> statement-breakpoint
-- Preserve all legacy appearance and company progress; ambiguous presentation uses the old female default.
UPDATE "character" SET "character_model_id" = CASE WHEN upper("presentation") = 'MALE' THEN 'founder_male_01' ELSE 'founder_female_01' END;
--> statement-breakpoint
UPDATE "company" AS company SET "game_state" = jsonb_set(company."game_state", '{playerCharacter,characterModelId}', to_jsonb(character."character_model_id"), true)
FROM "character" AS character WHERE company."character_id" = character."id" AND jsonb_typeof(company."game_state"->'playerCharacter') = 'object';
