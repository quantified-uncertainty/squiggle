/*
  Warnings:

  - Added the required column `code` to the `SquiggleSnippet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SquiggleSnippet" ADD COLUMN     "code" TEXT NOT NULL;
