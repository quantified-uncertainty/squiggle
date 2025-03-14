import { Prisma } from "@quri/hub-db";

import { prisma } from "@/lib/server/prisma";
import { checkRootUser } from "@/users/auth";

import {
  aggregateEvalMetrics,
  EvalMetrics,
  parseWorkflowMetrics,
  WorkflowMetrics,
} from "./summaryEvals";

// Selection for fetching eval data with detailed information
export const evalSelectWithDetails = {
  id: true,
  createdAt: true,
  updatedAt: true,
  evaluator: {
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
  evalResults: {
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
} satisfies Prisma.EvalSelect;

// Base type for eval data from Prisma
type DbEvalWithDetails = Prisma.EvalGetPayload<{
  select: typeof evalSelectWithDetails;
}>;

// DTO type with aggregated metrics
export type EvalWithDetailsDTO = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  evaluator: {
    id: string;
    name: string;
    type: string;
  };
  specList: {
    id: string;
    name: string;
  };
  evalResults: {
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
  const metrics = aggregateEvalMetrics(dbEval.evalResults);

  return {
    id: dbEval.id,
    createdAt: dbEval.createdAt,
    updatedAt: dbEval.updatedAt,
    evaluator: dbEval.evaluator,
    specList: dbEval.specList,
    evalResults: dbEval.evalResults.map((result) => ({
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

  const dbEval = await prisma.eval.findUniqueOrThrow({
    where: { id },
    select: evalSelectWithDetails,
  });

  return evalWithDetailsToDTO(dbEval);
}
