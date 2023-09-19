ALTER TABLE "SquiggleSnippet" ADD COLUMN     "version" TEXT;
UPDATE "SquiggleSnippet" SET "version" = '0.8.5' WHERE "version" IS NULL;
ALTER TABLE "SquiggleSnippet" ALTER COLUMN "version" SET NOT NULL;
