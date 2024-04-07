-- CreateTable
CREATE TABLE "ModelRevisionBuild" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modelRevisionId" TEXT NOT NULL,
    "runtime" DOUBLE PRECISION NOT NULL,
    "errors" TEXT[],

    CONSTRAINT "ModelRevisionBuild_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ModelRevisionBuild_modelRevisionId_idx" ON "ModelRevisionBuild"("modelRevisionId");

-- AddForeignKey
ALTER TABLE "ModelRevisionBuild" ADD CONSTRAINT "ModelRevisionBuild_modelRevisionId_fkey" FOREIGN KEY ("modelRevisionId") REFERENCES "ModelRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
