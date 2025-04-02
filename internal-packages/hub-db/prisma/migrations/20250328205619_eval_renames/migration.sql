/*
  Warnings:

  - You are about to drop the `Eval` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EvalResult` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EvalRunner` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Spec` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SpecList` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SpecsOnSpecLists` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EvaluationState" AS ENUM ('Pending', 'Running', 'Completed', 'Failed');

-- CreateEnum
CREATE TYPE "EpistemicAgentType" AS ENUM ('SquiggleAI');

-- DropForeignKey
ALTER TABLE "Eval" DROP CONSTRAINT "Eval_runnerId_fkey";

-- DropForeignKey
ALTER TABLE "Eval" DROP CONSTRAINT "Eval_specListId_fkey";

-- DropForeignKey
ALTER TABLE "EvalResult" DROP CONSTRAINT "EvalResult_evalId_fkey";

-- DropForeignKey
ALTER TABLE "EvalResult" DROP CONSTRAINT "EvalResult_specId_fkey";

-- DropForeignKey
ALTER TABLE "EvalResult" DROP CONSTRAINT "EvalResult_workflowId_fkey";

-- DropForeignKey
ALTER TABLE "SpecsOnSpecLists" DROP CONSTRAINT "SpecsOnSpecLists_specId_fkey";

-- DropForeignKey
ALTER TABLE "SpecsOnSpecLists" DROP CONSTRAINT "SpecsOnSpecLists_specListId_fkey";

-- DropTable
DROP TABLE "Eval";

-- DropTable
DROP TABLE "EvalResult";

-- DropTable
DROP TABLE "EvalRunner";

-- DropTable
DROP TABLE "Spec";

-- DropTable
DROP TABLE "SpecList";

-- DropTable
DROP TABLE "SpecsOnSpecLists";

-- DropEnum
DROP TYPE "EvalRunnerType";

-- DropEnum
DROP TYPE "EvalState";

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionSet" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "QuestionSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionsOnQuestionSets" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "questionSetId" TEXT NOT NULL,

    CONSTRAINT "QuestionsOnQuestionSets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "state" "EvaluationState" NOT NULL DEFAULT 'Pending',
    "errorMsg" TEXT,
    "agentId" TEXT NOT NULL,
    "questionSetId" TEXT NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Value" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "questionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "workflowId" TEXT,

    CONSTRAINT "Value_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EpistemicAgent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EpistemicAgentType" NOT NULL DEFAULT 'SquiggleAI',
    "config" JSONB NOT NULL,

    CONSTRAINT "EpistemicAgent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuestionsOnQuestionSets_questionId_idx" ON "QuestionsOnQuestionSets"("questionId");

-- CreateIndex
CREATE INDEX "QuestionsOnQuestionSets_questionSetId_idx" ON "QuestionsOnQuestionSets"("questionSetId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionsOnQuestionSets_questionId_questionSetId_key" ON "QuestionsOnQuestionSets"("questionId", "questionSetId");

-- CreateIndex
CREATE UNIQUE INDEX "Value_workflowId_key" ON "Value"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "Value_questionId_evaluationId_key" ON "Value"("questionId", "evaluationId");

-- AddForeignKey
ALTER TABLE "QuestionsOnQuestionSets" ADD CONSTRAINT "QuestionsOnQuestionSets_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionsOnQuestionSets" ADD CONSTRAINT "QuestionsOnQuestionSets_questionSetId_fkey" FOREIGN KEY ("questionSetId") REFERENCES "QuestionSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "EpistemicAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_questionSetId_fkey" FOREIGN KEY ("questionSetId") REFERENCES "QuestionSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Value" ADD CONSTRAINT "Value_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Value" ADD CONSTRAINT "Value_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Value" ADD CONSTRAINT "Value_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "AiWorkflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
