-- CreateTable
CREATE TABLE "Searchable" (
    "id" TEXT NOT NULL,
    "modelId" TEXT,
    "definitionId" TEXT,
    "userId" TEXT,
    "groupId" TEXT,

    CONSTRAINT "Searchable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Searchable_modelId_key" ON "Searchable"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "Searchable_definitionId_key" ON "Searchable"("definitionId");

-- CreateIndex
CREATE UNIQUE INDEX "Searchable_userId_key" ON "Searchable"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Searchable_groupId_key" ON "Searchable"("groupId");

-- AddForeignKey
ALTER TABLE "Searchable" ADD CONSTRAINT "Searchable_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Searchable" ADD CONSTRAINT "Searchable_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "RelativeValuesDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Searchable" ADD CONSTRAINT "Searchable_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Searchable" ADD CONSTRAINT "Searchable_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
