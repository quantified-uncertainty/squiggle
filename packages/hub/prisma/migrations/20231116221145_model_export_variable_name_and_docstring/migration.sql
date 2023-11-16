-- AlterTable
ALTER TABLE "ModelExport" ADD COLUMN     "docstring" TEXT,
ADD COLUMN     "variableType" TEXT NOT NULL DEFAULT 'OTHER';
