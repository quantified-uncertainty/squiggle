import { z } from "zod";

import { loadWorkflows } from "@/ai/data/loadWorkflows";
import { numberInString } from "@/lib/zodUtils";

import { AiDashboard } from "./AiDashboard";

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { limit, allUsers } = z
    .object({
      limit: numberInString.optional(),
      allUsers: z.string().optional(), // root-only flag
    })
    .parse(await searchParams);

  const { workflows, hasMore } = await loadWorkflows({
    limit,
    allUsers: !!allUsers,
  });

  return (
    <AiDashboard initialWorkflows={workflows} hasMoreWorkflows={hasMore} />
  );
}
