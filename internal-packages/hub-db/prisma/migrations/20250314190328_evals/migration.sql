-- CreateEnum
CREATE TYPE "EvalState" AS ENUM ('Pending', 'Running', 'Completed', 'Failed');

-- CreateEnum
CREATE TYPE "EvalRunnerType" AS ENUM ('SquiggleAI');

-- AlterTable
ALTER TABLE "AiWorkflow" ADD COLUMN     "metrics" JSONB;

-- CreateTable
CREATE TABLE "Spec" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Spec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecList" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "SpecList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecsOnSpecLists" (
    "id" TEXT NOT NULL,
    "specId" TEXT NOT NULL,
    "specListId" TEXT NOT NULL,

    CONSTRAINT "SpecsOnSpecLists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Eval" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "state" "EvalState" NOT NULL DEFAULT 'Pending',
    "errorMsg" TEXT,
    "runnerId" TEXT NOT NULL,
    "specListId" TEXT NOT NULL,

    CONSTRAINT "Eval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvalResult" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "specId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "evalId" TEXT NOT NULL,
    "workflowId" TEXT,

    CONSTRAINT "EvalResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvalRunner" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EvalRunnerType" NOT NULL DEFAULT 'SquiggleAI',
    "config" JSONB NOT NULL,

    CONSTRAINT "EvalRunner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpecsOnSpecLists_specId_idx" ON "SpecsOnSpecLists"("specId");

-- CreateIndex
CREATE INDEX "SpecsOnSpecLists_specListId_idx" ON "SpecsOnSpecLists"("specListId");

-- CreateIndex
CREATE UNIQUE INDEX "SpecsOnSpecLists_specId_specListId_key" ON "SpecsOnSpecLists"("specId", "specListId");

-- CreateIndex
CREATE UNIQUE INDEX "EvalResult_workflowId_key" ON "EvalResult"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "EvalResult_specId_evalId_key" ON "EvalResult"("specId", "evalId");

-- AddForeignKey
ALTER TABLE "SpecsOnSpecLists" ADD CONSTRAINT "SpecsOnSpecLists_specId_fkey" FOREIGN KEY ("specId") REFERENCES "Spec"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecsOnSpecLists" ADD CONSTRAINT "SpecsOnSpecLists_specListId_fkey" FOREIGN KEY ("specListId") REFERENCES "SpecList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Eval" ADD CONSTRAINT "Eval_runnerId_fkey" FOREIGN KEY ("runnerId") REFERENCES "EvalRunner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Eval" ADD CONSTRAINT "Eval_specListId_fkey" FOREIGN KEY ("specListId") REFERENCES "SpecList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvalResult" ADD CONSTRAINT "EvalResult_specId_fkey" FOREIGN KEY ("specId") REFERENCES "Spec"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvalResult" ADD CONSTRAINT "EvalResult_evalId_fkey" FOREIGN KEY ("evalId") REFERENCES "Eval"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvalResult" ADD CONSTRAINT "EvalResult_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "AiWorkflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
