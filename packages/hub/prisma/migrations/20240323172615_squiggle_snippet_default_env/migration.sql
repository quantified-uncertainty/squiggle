-- AlterTable
ALTER TABLE "SquiggleSnippet" ADD COLUMN     "autorunMode" BOOLEAN,
ADD COLUMN     "sampleCount" INTEGER,
ADD COLUMN     "xyPointLength" INTEGER,
ALTER COLUMN "seed" DROP DEFAULT;
