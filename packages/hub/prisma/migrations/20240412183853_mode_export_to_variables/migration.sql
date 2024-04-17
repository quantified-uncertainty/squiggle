/*
  Warnings:

  - You are about to drop the `ModelExport` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ModelExport" DROP CONSTRAINT "ModelExport_modelRevisionId_fkey";

-- DropTable
DROP TABLE "ModelExport";

-- CreateTable
CREATE TABLE "Variable" (
    "id" TEXT NOT NULL,
    "variableName" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,

    CONSTRAINT "Variable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariableRevision" (
    "id" TEXT NOT NULL,
    "modelRevisionId" TEXT NOT NULL,
    "variableId" TEXT NOT NULL,
    "variableName" TEXT NOT NULL,
    "title" TEXT,
    "docstring" TEXT NOT NULL DEFAULT '',
    "variableType" TEXT NOT NULL DEFAULT 'OTHER',

    CONSTRAINT "VariableRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Variable_modelId_variableName_key" ON "Variable"("modelId", "variableName");

-- CreateIndex
CREATE UNIQUE INDEX "VariableRevision_modelRevisionId_variableName_key" ON "VariableRevision"("modelRevisionId", "variableName");

-- AddForeignKey
ALTER TABLE "Variable" ADD CONSTRAINT "Variable_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariableRevision" ADD CONSTRAINT "VariableRevision_modelRevisionId_fkey" FOREIGN KEY ("modelRevisionId") REFERENCES "ModelRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariableRevision" ADD CONSTRAINT "VariableRevision_variableId_fkey" FOREIGN KEY ("variableId") REFERENCES "Variable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
