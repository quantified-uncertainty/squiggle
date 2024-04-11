ALTER TABLE "ModelExport" DROP CONSTRAINT "ModelExport_modelRevisionId_fkey";

-- RenameTable
ALTER TABLE "ModelExport" RENAME TO "VariableExportRevision";

-- RenameIndex
ALTER INDEX "ModelExport_modelRevisionId_variableName_key" RENAME TO "VariableExportRevision_modelRevisionId_variableName_key";

-- AddForeignKey
ALTER TABLE "VariableExportRevision" ADD CONSTRAINT "VariableExportRevision_modelRevisionId_fkey" FOREIGN KEY ("modelRevisionId") REFERENCES "ModelRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;