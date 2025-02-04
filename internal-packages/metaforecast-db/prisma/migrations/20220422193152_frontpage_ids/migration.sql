-- CreateTable
CREATE TABLE "FrontpageId" (
    "id" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "FrontpageId_id_key" ON "FrontpageId"("id");

-- AddForeignKey
ALTER TABLE "FrontpageId" ADD CONSTRAINT "FrontpageId_id_fkey" FOREIGN KEY ("id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
