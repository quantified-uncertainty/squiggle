-- AlterTable
ALTER TABLE "AiWorkflow" ADD COLUMN     "format" INTEGER NOT NULL DEFAULT 2;

-- old workflows
UPDATE "AiWorkflow" SET "format" = 1;
