import { z } from "zod";

import { EvaluationState, Prisma } from "@quri/hub-db";

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

// Parse workflow metrics and handle errors
export function parseWorkflowMetrics(
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
export function aggregateEvalMetrics(
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

const select = {
  id: true,
  createdAt: true,
  state: true,
  errorMsg: true,
  agent: {
    select: {
      id: true,
      name: true,
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
  _count: {
    select: {
      values: true,
    },
  },
  // Need to include evalResults with their workflows to calculate metrics
  values: {
    select: {
      workflow: {
        select: {
          metrics: true,
        },
      },
    },
  },
} satisfies Prisma.EvaluationSelect;

type DbEvaluationSummary = Prisma.EvaluationGetPayload<{
  select: typeof select;
}>;

// Type for eval summary data used in listings
export type EvaluationSummaryDTO = {
  id: string;
  createdAt: Date;
  state: EvaluationState;
  errorMsg?: string | null;
  metrics: EvalMetrics;
  agent: {
    id: string;
    name: string;
  };
  questionSet: {
    id: string;
    name: string;
    questionCount: number;
  };
  _count: {
    values: number;
  };
};

function evalSummaryToDTO(dbEval: DbEvaluationSummary): EvaluationSummaryDTO {
  const metrics = aggregateEvalMetrics(dbEval.values);

  return {
    id: dbEval.id,
    createdAt: dbEval.createdAt,
    state: dbEval.state,
    errorMsg: dbEval.errorMsg,
    agent: dbEval.agent,
    questionSet: {
      id: dbEval.questionSet.id,
      name: dbEval.questionSet.name,
      questionCount: dbEval.questionSet._count.questions,
    },
    _count: dbEval._count,
    metrics,
  };
}

export async function getAllEvaluations(): Promise<EvaluationSummaryDTO[]> {
  await checkRootUser();

  // First get all evals with their result counts
  const rows = await prisma.evaluation.findMany({
    select,
    orderBy: {
      createdAt: "desc",
    },
  });

  return rows.map(evalSummaryToDTO);
}

export async function getEvaluationsByQuestionSetId(
  questionSetId: string
): Promise<EvaluationSummaryDTO[]> {
  await checkRootUser();

  const rows = await prisma.evaluation.findMany({
    where: {
      questionSetId,
    },
    select: select,
    orderBy: {
      createdAt: "desc",
    },
  });

  return rows.map(evalSummaryToDTO);
}
