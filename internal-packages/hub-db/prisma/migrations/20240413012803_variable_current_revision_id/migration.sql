/*
  Warnings:

  - A unique constraint covering the columns `[currentRevisionId]` on the table `Variable` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Variable" ADD COLUMN     "currentRevisionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Variable_currentRevisionId_key" ON "Variable"("currentRevisionId");

-- AddForeignKey
ALTER TABLE "Variable" ADD CONSTRAINT "Variable_currentRevisionId_fkey" FOREIGN KEY ("currentRevisionId") REFERENCES "VariableRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
