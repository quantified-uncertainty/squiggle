import { EvaluationState, Prisma } from "@quri/hub-db";

import { prisma } from "@/lib/server/prisma";
import { checkRootUser } from "@/users/auth";

import {
  aggregateEvalMetrics,
  EvalMetrics,
  parseWorkflowMetrics,
  WorkflowMetrics,
} from "./summaryEvals";

// Selection for fetching eval data with detailed information
export const evaluationSelectWithDetails = {
  id: true,
  createdAt: true,
  updatedAt: true,
  state: true,
  errorMsg: true,
  agent: {
    select: {
      id: true,
      name: true,
      type: true,
    },
  },
  questionSet: {
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          questions: true,
        },
      },
    },
  },
  values: {
    select: {
      id: true,
      code: true,
      question: true,
      workflow: {
        select: {
          id: true,
          markdown: true,
          metrics: true,
        },
      },
    },
  },
} satisfies Prisma.EvaluationSelect;

// Base type for eval data from Prisma
type DbEvalWithDetails = Prisma.EvaluationGetPayload<{
  select: typeof evaluationSelectWithDetails;
}>;

// DTO type with aggregated metrics
export type EvalWithDetailsDTO = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  state: EvaluationState;
  errorMsg: string | null;
  agent: {
    id: string;
    name: string;
    type: string;
  };
  questionSet: {
    id: string;
    name: string;
    questionCount: number;
  };
  values: {
    id: string;
    code: string;
    question: {
      id: string;
      description: string;
    };
    workflow?: {
      id: string;
      markdown: string;
      metrics?: WorkflowMetrics;
    };
  }[];
  metrics: EvalMetrics;
};

// Function to convert from DB type to DTO with aggregated metrics
function evalWithDetailsToDTO(dbEval: DbEvalWithDetails): EvalWithDetailsDTO {
  const metrics = aggregateEvalMetrics(dbEval.values);

  return {
    id: dbEval.id,
    createdAt: dbEval.createdAt,
    updatedAt: dbEval.updatedAt,
    state: dbEval.state,
    errorMsg: dbEval.errorMsg,
    agent: dbEval.agent,
    questionSet: {
      id: dbEval.questionSet.id,
      name: dbEval.questionSet.name,
      questionCount: dbEval.questionSet._count.questions,
    },
    values: dbEval.values.map((value) => ({
      id: value.id,
      code: value.code,
      question: value.question,
      workflow: value.workflow
        ? {
            id: value.workflow.id,
            markdown: value.workflow.markdown,
            metrics: parseWorkflowMetrics(value.workflow.metrics),
          }
        : undefined,
    })),
    metrics,
  };
}

export async function getEvalById(id: string): Promise<EvalWithDetailsDTO> {
  await checkRootUser();

  const dbEval = await prisma.evaluation.findUniqueOrThrow({
    where: { id },
    select: evaluationSelectWithDetails,
  });

  return evalWithDetailsToDTO(dbEval);
}
