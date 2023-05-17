/*
  Warnings:

  - Added the required column `modelId` to the `SquiggleSnippet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SquiggleSnippet" ADD COLUMN     "modelId" TEXT;

-- AddForeignKey
ALTER TABLE "SquiggleSnippet" ADD CONSTRAINT "SquiggleSnippet_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE "SquiggleSnippet"
  SET "modelId" = "Model".id
  FROM "Model"
  WHERE "SquiggleSnippet".id = "Model"."modelId";

ALTER TABLE "SquiggleSnippet" ALTER COLUMN     "modelId" SET NOT NULL;
