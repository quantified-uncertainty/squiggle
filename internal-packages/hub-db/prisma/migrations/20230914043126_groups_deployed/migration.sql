/*
  Warnings:

  - Made the column `ownerId` on table `Model` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ownerId` on table `RelativeValuesDefinition` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Model" DROP CONSTRAINT "Model_userId_fkey";

-- DropForeignKey
ALTER TABLE "RelativeValuesDefinition" DROP CONSTRAINT "RelativeValuesDefinition_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "RelativeValuesDefinition" DROP CONSTRAINT "RelativeValuesDefinition_userId_fkey";

-- AlterTable
ALTER TABLE "Model" ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "ownerId" SET NOT NULL;

-- AlterTable
ALTER TABLE "RelativeValuesDefinition" ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "ownerId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Model" ADD CONSTRAINT "Model_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelativeValuesDefinition" ADD CONSTRAINT "RelativeValuesDefinition_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelativeValuesDefinition" ADD CONSTRAINT "RelativeValuesDefinition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
