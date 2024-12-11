-- CreateEnum
CREATE TYPE "AiWorkflowFormat" AS ENUM ('V1_0', 'V2_0');

-- AlterTable
ALTER TABLE "AiWorkflow" ADD COLUMN     "format" "AiWorkflowFormat" NOT NULL DEFAULT 'V1_0',
ADD COLUMN     "markdown" TEXT NOT NULL DEFAULT '';
