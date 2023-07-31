-- AlterTable
ALTER TABLE "RelativeValuesDefinition"
  ADD COLUMN     "currentRevisionId" TEXT,
  ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "RelativeValuesDefinition_currentRevisionId_key" ON "RelativeValuesDefinition"("currentRevisionId");

UPDATE "RelativeValuesDefinition"
    SET "currentRevisionId" = j."id", "updatedAt" = j."createdAt"
    FROM (
        SELECT DISTINCT ON ("definitionId") "definitionId", "createdAt", id
        FROM "RelativeValuesDefinitionRevision"
        ORDER BY "definitionId", "createdAt" DESC
    ) j
    WHERE "RelativeValuesDefinition"."id" = j."definitionId";


-- AddForeignKey
ALTER TABLE "RelativeValuesDefinition"
  ADD CONSTRAINT "RelativeValuesDefinition_currentRevisionId_fkey"
  FOREIGN KEY ("currentRevisionId")
  REFERENCES "RelativeValuesDefinitionRevision"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

ALTER TABLE "RelativeValuesDefinition" ALTER COLUMN "updatedAt" SET NOT NULL;
