ALTER TABLE "SquiggleSnippet" ADD COLUMN     "seed" TEXT DEFAULT 'DEFAULT_SEED';
UPDATE "SquiggleSnippet" SET "seed" = 'DEFAULT_SEED' WHERE "seed" IS NULL;
ALTER TABLE "SquiggleSnippet" ALTER COLUMN "seed" SET NOT NULL;