ALTER TABLE "users"
ADD COLUMN "prompt_regenerations_this_month" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "prompt_regeneration_month" TIMESTAMP(3);
