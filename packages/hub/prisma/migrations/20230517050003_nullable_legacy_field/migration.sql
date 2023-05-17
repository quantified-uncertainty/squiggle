-- DropForeignKey
ALTER TABLE "Model" DROP CONSTRAINT "squiggleSnippet_modelId";

-- AlterTable
ALTER TABLE "Model" ALTER COLUMN "modelId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Model" ADD CONSTRAINT "squiggleSnippet_modelId" FOREIGN KEY ("modelId") REFERENCES "SquiggleSnippet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
