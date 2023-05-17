-- AlterTable
ALTER TABLE "SquiggleSnippet" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Model_createdAt_idx" ON "Model"("createdAt");

-- CreateIndex
CREATE INDEX "SquiggleSnippet_modelId_createdAt_idx" ON "SquiggleSnippet"("modelId", "createdAt");
