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
} satisfies Prisma.EpistemicAgentSelect;

// Type for eval runner data
type DbEpistemicAgent = Prisma.EpistemicAgentGetPayload<{
  select: typeof select;
}>;

export type EpistemicAgentDTO = {
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

function agentToDTO(dbRow: DbEpistemicAgent): EpistemicAgentDTO {
  const config = llmConfigSchema.safeParse(dbRow.config);

  return {
    ...dbRow,
    config: config.success ? config.data : undefined, // TODO - throw? report somehow?
  };
}

export async function getAllEpistemicAgents(): Promise<EpistemicAgentDTO[]> {
  await checkRootUser();

  const rows = await prisma.epistemicAgent.findMany({
    select,
    orderBy: {
      name: "asc",
    },
  });

  return rows.map(agentToDTO);
}

export async function getEpistemicAgentById(
  id: string
): Promise<EpistemicAgentDTO> {
  await checkRootUser();

  const row = await prisma.epistemicAgent.findUniqueOrThrow({
    where: { id },
    select,
  });

  return agentToDTO(row);
}
