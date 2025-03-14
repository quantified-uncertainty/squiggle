import { Prisma } from "@quri/hub-db";
import { LlmConfig } from "@quri/squiggle-ai";
import { llmConfigSchema } from "@quri/squiggle-ai/server";

import { prisma } from "@/lib/server/prisma";
import { checkRootUser } from "@/users/auth";

// Selection for fetching evaluator data
export const evaluatorSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  name: true,
  type: true,
  config: true,
  _count: {
    select: {
      evals: true,
    },
  },
} satisfies Prisma.EvaluatorSelect;

// Type for evaluator data
type DbEvaluator = Prisma.EvaluatorGetPayload<{
  select: typeof evaluatorSelect;
}>;

export type EvaluatorDTO = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  type: string;
  config: LlmConfig | undefined;
  _count: {
    evals: number;
  };
};

function evaluatorToDTO(dbEvaluator: DbEvaluator): EvaluatorDTO {
  const config = llmConfigSchema.safeParse(dbEvaluator.config);

  return {
    ...dbEvaluator,
    config: config.success ? config.data : undefined, // TODO - throw? report somehow?
  };
}

export async function getAllEvaluators(): Promise<EvaluatorDTO[]> {
  await checkRootUser();

  const dbEvaluators = await prisma.evaluator.findMany({
    select: evaluatorSelect,
    orderBy: {
      name: "asc",
    },
  });

  return dbEvaluators.map(evaluatorToDTO);
}

export async function getEvaluatorById(id: string): Promise<EvaluatorDTO> {
  await checkRootUser();

  const dbEvaluator = await prisma.evaluator.findUniqueOrThrow({
    where: { id },
    select: evaluatorSelect,
  });

  return evaluatorToDTO(dbEvaluator);
}
