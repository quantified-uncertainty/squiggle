-- AlterTable
ALTER TABLE "ModelRevision" ADD COLUMN     "authorId" TEXT;

-- AddForeignKey
ALTER TABLE "ModelRevision" ADD CONSTRAINT "ModelRevision_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
