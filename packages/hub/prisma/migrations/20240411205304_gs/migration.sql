/*
  Warnings:

  - You are about to drop the `VariableExportRevision` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "VariableExportRevision" DROP CONSTRAINT "VariableExportRevision_modelRevisionId_fkey";

-- DropTable
DROP TABLE "VariableExportRevision";

-- CreateTable
CREATE TABLE "Variable" (
    "id" TEXT NOT NULL,
    "modelRevisionId" TEXT NOT NULL,
    "variableName" TEXT NOT NULL,
    "title" TEXT,
    "docstring" TEXT NOT NULL DEFAULT '',
    "variableType" TEXT NOT NULL DEFAULT 'OTHER',
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Variable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Variable_modelRevisionId_variableName_key" ON "Variable"("modelRevisionId", "variableName");

-- AddForeignKey
ALTER TABLE "Variable" ADD CONSTRAINT "Variable_modelRevisionId_fkey" FOREIGN KEY ("modelRevisionId") REFERENCES "ModelRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
