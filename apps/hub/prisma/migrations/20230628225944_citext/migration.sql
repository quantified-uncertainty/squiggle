-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- AlterTable
ALTER TABLE "Model" ALTER COLUMN "slug" SET DATA TYPE CITEXT;

-- AlterTable
ALTER TABLE "RelativeValuesDefinition" ALTER COLUMN "slug" SET DATA TYPE CITEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "username" SET DATA TYPE CITEXT;
