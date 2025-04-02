-- AlterEnum
ALTER TYPE "EpistemicAgentType" ADD VALUE 'Manifold';

-- AlterTable
ALTER TABLE "EpistemicAgent" ADD COLUMN     "ownerId" TEXT;

-- AlterTable
ALTER TABLE "Evaluation" ADD COLUMN     "ownerId" TEXT;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "ownerId" TEXT;

-- AlterTable
ALTER TABLE "QuestionSet" ADD COLUMN     "ownerId" TEXT;

-- AlterTable
ALTER TABLE "Value" ADD COLUMN     "ownerId" TEXT;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSet" ADD CONSTRAINT "QuestionSet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Value" ADD CONSTRAINT "Value_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpistemicAgent" ADD CONSTRAINT "EpistemicAgent_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
