-- DropForeignKey
ALTER TABLE "Model" DROP CONSTRAINT "squiggleSnippet_modelId";

-- DropIndex
DROP INDEX "Model_modelId_key";

-- CreateTable
CREATE TABLE "ModelRevision" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modelId" TEXT NOT NULL,
    "contentType" "ModelType" NOT NULL,
    "contentId" TEXT,

    CONSTRAINT "ModelRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModelRevision_contentId_key" ON "ModelRevision"("contentId");

-- CreateIndex
CREATE INDEX "Model_createdAt_idx" ON "Model"("createdAt");

INSERT INTO "ModelRevision" ("createdAt", "modelId", "contentType", "contentId")
  SELECT "createdAt", "id", "modelType", "modelId"
  FROM "Model";

-- AlterTable
ALTER TABLE "Model" DROP COLUMN "modelId",
DROP COLUMN "modelType";

-- AddForeignKey
ALTER TABLE "ModelRevision" ADD CONSTRAINT "ModelRevision_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelRevision" ADD CONSTRAINT "squiggleSnippet_contentId" FOREIGN KEY ("contentId") REFERENCES "SquiggleSnippet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
