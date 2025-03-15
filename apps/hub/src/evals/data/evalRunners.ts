import { Prisma } from "@quri/hub-db";
import { LlmConfig } from "@quri/squiggle-ai";
import { llmConfigSchema } from "@quri/squiggle-ai/server";

import { prisma } from "@/lib/server/prisma";
import { checkRootUser } from "@/users/auth";

// Selection for fetching runner data
const select = {
  id: true,
  createdAt: true,
  updatedAt: true,
  name: true,
  type: true,
  config: true,
  _count: {
    select: {
      evaluations: true,
    },
  },
} satisfies Prisma.EvalRunnerSelect;

// Type for eval runner data
type DbEvalRunner = Prisma.EvalRunnerGetPayload<{
  select: typeof select;
}>;

export type EvalRunnerDTO = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  type: string;
  config: LlmConfig | undefined;
  _count: {
    evaluations: number;
  };
};

function runnerToDTO(dbRow: DbEvalRunner): EvalRunnerDTO {
  const config = llmConfigSchema.safeParse(dbRow.config);

  return {
    ...dbRow,
    config: config.success ? config.data : undefined, // TODO - throw? report somehow?
  };
}

export async function getAllEvalRunners(): Promise<EvalRunnerDTO[]> {
  await checkRootUser();

  const rows = await prisma.evalRunner.findMany({
    select,
    orderBy: {
      name: "asc",
    },
  });

  return rows.map(runnerToDTO);
}

export async function getEvalRunnerById(id: string): Promise<EvalRunnerDTO> {
  await checkRootUser();

  const row = await prisma.evalRunner.findUniqueOrThrow({
    where: { id },
    select,
  });

  return runnerToDTO(row);
}
