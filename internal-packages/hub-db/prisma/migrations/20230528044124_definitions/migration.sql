-- CreateTable
CREATE TABLE "RelativeValuesDefinition" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "RelativeValuesDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelativeValuesDefinitionRevision" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "definitionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "clusters" JSONB NOT NULL,

    CONSTRAINT "RelativeValuesDefinitionRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelativeValuesExport" (
    "id" TEXT NOT NULL,
    "modelRevisionId" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "variableName" TEXT NOT NULL,

    CONSTRAINT "RelativeValuesExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelativeValuesPairCache" (
    "id" TEXT NOT NULL,
    "exportId" TEXT NOT NULL,
    "firstItem" TEXT NOT NULL,
    "secondItem" TEXT NOT NULL,
    "error" TEXT,
    "result" JSONB,

    CONSTRAINT "RelativeValuesPairCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RelativeValuesDefinition_createdAt_idx" ON "RelativeValuesDefinition"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RelativeValuesDefinition_slug_ownerId_key" ON "RelativeValuesDefinition"("slug", "ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "RelativeValuesExport_modelRevisionId_definitionId_variableN_key" ON "RelativeValuesExport"("modelRevisionId", "definitionId", "variableName");

-- AddForeignKey
ALTER TABLE "RelativeValuesDefinition" ADD CONSTRAINT "RelativeValuesDefinition_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelativeValuesDefinitionRevision" ADD CONSTRAINT "RelativeValuesDefinitionRevision_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "RelativeValuesDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelativeValuesExport" ADD CONSTRAINT "RelativeValuesExport_modelRevisionId_fkey" FOREIGN KEY ("modelRevisionId") REFERENCES "ModelRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelativeValuesExport" ADD CONSTRAINT "RelativeValuesExport_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "RelativeValuesDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelativeValuesPairCache" ADD CONSTRAINT "RelativeValuesPairCache_exportId_fkey" FOREIGN KEY ("exportId") REFERENCES "RelativeValuesExport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
