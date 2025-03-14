import { z } from "zod";

import { Prisma } from "@quri/hub-db";

import { prisma } from "@/lib/server/prisma";
import { checkRootUser } from "@/users/auth";

// Define the workflow metrics schema for validation
const workflowMetricsSchema = z.object({
  totalPrice: z.number().optional(),
  llmRunCount: z.number().optional(),
});

export type WorkflowMetrics = z.infer<typeof workflowMetricsSchema>;

// Aggregated metrics for an evaluation
export type EvalMetrics = WorkflowMetrics;

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

// Parse workflow metrics and handle errors
function parseWorkflowMetrics(
  metricsJson: unknown
): WorkflowMetrics | undefined {
  if (!metricsJson) return undefined;

  try {
    return workflowMetricsSchema.parse(metricsJson) ?? undefined;
  } catch (error) {
    console.error("Failed to parse workflow metrics:", error);
    return undefined;
  }
}

// Aggregate metrics from all workflows in an eval
function aggregateEvalMetrics(
  evalResults: {
    workflow: {
      metrics: unknown;
    } | null;
  }[]
): EvalMetrics {
  let totalPrice = 0;
  let llmRunCount = 0;
  let hasAnyMetrics = false;

  for (const result of evalResults) {
    if (result.workflow?.metrics) {
      const metrics = parseWorkflowMetrics(result.workflow.metrics);
      if (metrics) {
        hasAnyMetrics = true;
        if (metrics.totalPrice !== undefined && metrics.totalPrice !== null) {
          totalPrice += metrics.totalPrice;
        }
        if (metrics.llmRunCount !== undefined && metrics.llmRunCount !== null) {
          llmRunCount += metrics.llmRunCount;
        }
      }
    }
  }

  return {
    totalPrice: hasAnyMetrics ? totalPrice : undefined,
    llmRunCount: hasAnyMetrics ? llmRunCount : undefined,
  };
}

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

const selectEvalSummary = {
  id: true,
  createdAt: true,
  evaluator: {
    select: {
      id: true,
      name: true,
    },
  },
  specList: {
    select: {
      id: true,
      name: true,
    },
  },
  _count: {
    select: {
      evalResults: true,
    },
  },
  // Need to include evalResults with their workflows to calculate metrics
  evalResults: {
    select: {
      workflow: {
        select: {
          metrics: true,
        },
      },
    },
  },
} satisfies Prisma.EvalSelect;

type DbEvalSummary = Prisma.EvalGetPayload<{
  select: typeof selectEvalSummary;
}>;

// Type for eval summary data used in listings
export type EvalSummaryDTO = {
  id: string;
  createdAt: Date;
  metrics: EvalMetrics;
  evaluator: {
    id: string;
    name: string;
  };
  specList?: {
    id: string;
    name: string;
  };
  _count: {
    evalResults: number;
  };
};

function evalSummaryToDTO(dbEval: DbEvalSummary): EvalSummaryDTO {
  const metrics = aggregateEvalMetrics(dbEval.evalResults);

  return {
    id: dbEval.id,
    createdAt: dbEval.createdAt,
    evaluator: dbEval.evaluator,
    specList: dbEval.specList,
    _count: dbEval._count,
    metrics,
  };
}

export async function getAllEvals(): Promise<EvalSummaryDTO[]> {
  await checkRootUser();

  // First get all evals with their result counts
  const evals = await prisma.eval.findMany({
    select: selectEvalSummary,
    orderBy: {
      createdAt: "desc",
    },
  });

  return evals.map(evalSummaryToDTO);
}

export async function getEvalsBySpecListId(
  specListId: string
): Promise<EvalSummaryDTO[]> {
  await checkRootUser();

  const evals = await prisma.eval.findMany({
    where: {
      specListId,
    },
    select: selectEvalSummary,
    orderBy: {
      createdAt: "desc",
    },
  });

  return evals.map(evalSummaryToDTO);
}

export async function getEvalById(id: string): Promise<EvalWithDetailsDTO> {
  await checkRootUser();

  const dbEval = await prisma.eval.findUniqueOrThrow({
    where: { id },
    select: evalSelectWithDetails,
  });

  return evalWithDetailsToDTO(dbEval);
}
