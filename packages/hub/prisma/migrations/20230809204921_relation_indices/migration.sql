-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Model_ownerId_idx" ON "Model"("ownerId");

-- CreateIndex
CREATE INDEX "ModelRevision_modelId_idx" ON "ModelRevision"("modelId");

-- CreateIndex
CREATE INDEX "RelativeValuesDefinition_ownerId_idx" ON "RelativeValuesDefinition"("ownerId");

-- CreateIndex
CREATE INDEX "RelativeValuesDefinitionRevision_definitionId_idx" ON "RelativeValuesDefinitionRevision"("definitionId");

-- CreateIndex
CREATE INDEX "RelativeValuesExport_modelRevisionId_idx" ON "RelativeValuesExport"("modelRevisionId");

-- CreateIndex
CREATE INDEX "RelativeValuesExport_definitionId_idx" ON "RelativeValuesExport"("definitionId");

-- CreateIndex
CREATE INDEX "RelativeValuesPairCache_exportId_idx" ON "RelativeValuesPairCache"("exportId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
