-- CreateTable
CREATE TABLE "ModelExport" (
    "id" TEXT NOT NULL,
    "modelRevisionId" TEXT NOT NULL,
    "variableName" TEXT NOT NULL,
    "title" TEXT,

    CONSTRAINT "ModelExport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModelExport_modelRevisionId_variableName_key" ON "ModelExport"("modelRevisionId", "variableName");

-- AddForeignKey
ALTER TABLE "ModelExport" ADD CONSTRAINT "ModelExport_modelRevisionId_fkey" FOREIGN KEY ("modelRevisionId") REFERENCES "ModelRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
