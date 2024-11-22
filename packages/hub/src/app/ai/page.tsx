import { z } from "zod";

import { numberInString } from "@/lib/zodUtils";
import { loadWorkflows } from "@/server/ai/data";

import { AiDashboard } from "./AiDashboard";

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { limit } = z
    .object({
      limit: numberInString.optional(),
    })
    .parse(await searchParams);

  const { workflows, hasMore } = await loadWorkflows({ limit });

  return (
    <AiDashboard initialWorkflows={workflows} hasMoreWorkflows={hasMore} />
  );
}
