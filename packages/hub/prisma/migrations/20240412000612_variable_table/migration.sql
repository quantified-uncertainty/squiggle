/*
  Warnings:

  - Added the required column `variableId` to the `VariableRevision` table without a default value. This is not possible if the table is not empty.

*/

-- Delete all existing VariableRevision records
DELETE FROM "VariableRevision";

-- AlterTable
ALTER TABLE "VariableRevision" ADD COLUMN     "variableId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Variable" (
    "id" TEXT NOT NULL,
    "variableName" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,

    CONSTRAINT "Variable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Variable_modelId_variableName_key" ON "Variable"("modelId", "variableName");

-- AddForeignKey
ALTER TABLE "Variable" ADD CONSTRAINT "Variable_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariableRevision" ADD CONSTRAINT "VariableRevision_variableId_fkey" FOREIGN KEY ("variableId") REFERENCES "Variable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
