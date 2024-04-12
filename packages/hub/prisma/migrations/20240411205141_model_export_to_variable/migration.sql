ALTER TABLE "ModelExport" DROP CONSTRAINT "ModelExport_modelRevisionId_fkey";

ALTER TABLE "ModelExport" RENAME TO "VariableRevision";

ALTER INDEX "ModelExport_modelRevisionId_variableName_key" RENAME TO "VariableRevision_modelRevisionId_variableName_key";

ALTER TABLE "VariableRevision" ADD CONSTRAINT "VariableRevision_modelRevisionId_fkey" FOREIGN KEY ("modelRevisionId") REFERENCES "ModelRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VariableRevision" RENAME CONSTRAINT "ModelExport_pkey" TO "VariableRevision_pkey";