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
  runner: {
    select: {
      id: true,
      name: true,
      type: true,
    },
  },
  specList: {
    select: {
      id: true,
      name: true,
      specs: {
        select: {
          spec: true,
        },
      },
    },
  },
  results: {
    select: {
      id: true,
      code: true,
      spec: true,
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
  runner: {
    id: string;
    name: string;
    type: string;
  };
  specList: {
    id: string;
    name: string;
  };
  results: {
    id: string;
    code: string;
    spec: {
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
  const metrics = aggregateEvalMetrics(dbEval.results);

  return {
    id: dbEval.id,
    createdAt: dbEval.createdAt,
    updatedAt: dbEval.updatedAt,
    state: dbEval.state,
    errorMsg: dbEval.errorMsg,
    runner: dbEval.runner,
    specList: dbEval.specList,
    results: dbEval.results.map((result) => ({
      id: result.id,
      code: result.code,
      spec: result.spec,
      workflow: result.workflow
        ? {
            id: result.workflow.id,
            markdown: result.workflow.markdown,
            metrics: parseWorkflowMetrics(result.workflow.metrics),
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
