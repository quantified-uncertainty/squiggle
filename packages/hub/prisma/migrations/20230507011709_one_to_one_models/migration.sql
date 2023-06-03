/*
  Warnings:

  - A unique constraint covering the columns `[modelId]` on the table `Model` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Model_modelId_key" ON "Model"("modelId");
