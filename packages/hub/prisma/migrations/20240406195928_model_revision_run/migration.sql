-- CreateTable
CREATE TABLE "ModelRevisionRun" (
    "id" TEXT NOT NULL,
    "modelRevisionId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "errors" TEXT[],

    CONSTRAINT "ModelRevisionRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModelRevisionRun_modelRevisionId_key" ON "ModelRevisionRun"("modelRevisionId");

-- AddForeignKey
ALTER TABLE "ModelRevisionRun" ADD CONSTRAINT "ModelRevisionRun_modelRevisionId_fkey" FOREIGN KEY ("modelRevisionId") REFERENCES "ModelRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
