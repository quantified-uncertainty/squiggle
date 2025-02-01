/*
  Warnings:

  - You are about to drop the column `stars` on the `history` table. All the data in the column will be lost.
  - You are about to drop the column `stars` on the `questions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "history" DROP COLUMN "stars";

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "stars";
