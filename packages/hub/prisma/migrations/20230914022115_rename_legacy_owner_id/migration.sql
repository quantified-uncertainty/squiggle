-- Models

ALTER TABLE "Model" RENAME CONSTRAINT "Model_ownerId_fkey" to "Model_userId_fkey";

ALTER INDEX "Model_ownerId_idx" RENAME TO "Model_userId_idx";
ALTER INDEX "Model_slug_ownerId_key" RENAME TO "Model_slug_userId_key";

ALTER TABLE "Model" RENAME COLUMN "ownerId" TO "userId";

-- RelativeValueDefinitions

ALTER TABLE "RelativeValuesDefinition" RENAME CONSTRAINT "RelativeValuesDefinition_ownerId_fkey" to "RelativeValuesDefinition_userId_fkey";

ALTER INDEX "RelativeValuesDefinition_ownerId_idx" RENAME TO "RelativeValuesDefinition_userId_idx";
ALTER INDEX "RelativeValuesDefinition_slug_ownerId_key" RENAME TO "RelativeValuesDefinition_slug_userId_key";

ALTER TABLE "RelativeValuesDefinition" RENAME COLUMN "ownerId" TO "userId";
