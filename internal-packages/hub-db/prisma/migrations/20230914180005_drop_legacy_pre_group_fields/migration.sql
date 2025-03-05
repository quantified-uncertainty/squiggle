/*
  Warnings:

  - You are about to drop the column `userId` on the `Model` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `RelativeValuesDefinition` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Model" DROP CONSTRAINT "Model_userId_fkey";

-- DropForeignKey
ALTER TABLE "RelativeValuesDefinition" DROP CONSTRAINT "RelativeValuesDefinition_userId_fkey";

-- DropIndex
DROP INDEX "Model_slug_userId_key";

-- DropIndex
DROP INDEX "Model_userId_idx";

-- DropIndex
DROP INDEX "RelativeValuesDefinition_slug_userId_key";

-- DropIndex
DROP INDEX "RelativeValuesDefinition_userId_idx";

-- DropIndex
DROP INDEX "User_username_key";

-- AlterTable
ALTER TABLE "Model" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "RelativeValuesDefinition" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "username";
