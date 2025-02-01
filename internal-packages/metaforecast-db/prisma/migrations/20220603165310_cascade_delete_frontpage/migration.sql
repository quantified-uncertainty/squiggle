-- DropForeignKey
ALTER TABLE "FrontpageId" DROP CONSTRAINT "FrontpageId_id_fkey";

-- AddForeignKey
ALTER TABLE "FrontpageId" ADD CONSTRAINT "FrontpageId_id_fkey" FOREIGN KEY ("id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
