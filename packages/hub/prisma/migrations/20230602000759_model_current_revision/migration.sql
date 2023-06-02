-- AlterTable
ALTER TABLE "Model"
    ADD COLUMN "currentRevisionId" TEXT;

-- AddForeignKey
ALTER TABLE "Model"
    ADD CONSTRAINT "Model_currentRevisionId_fkey"
    FOREIGN KEY ("currentRevisionId")
    REFERENCES "ModelRevision"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "Model_currentRevisionId_key" ON "Model"("currentRevisionId");

-- populate currentRevisionId field
UPDATE "Model"
    SET "currentRevisionId" = j."id"
    FROM (
        SELECT DISTINCT ON ("modelId") "modelId", id
        FROM "ModelRevision"
        ORDER BY "modelId", "createdAt" DESC
    ) j
    WHERE "Model"."id" = j."modelId";
