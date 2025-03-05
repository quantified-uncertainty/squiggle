-- AlterTable
ALTER TABLE "ModelExport" ADD COLUMN     "isCurrent" BOOLEAN NOT NULL DEFAULT false;
UPDATE "ModelExport" SET "isCurrent" = true WHERE "modelRevisionId" IN (SELECT "currentRevisionId" FROM "Model");