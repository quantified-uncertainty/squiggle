import { SessionProvider } from "next-auth/react";
import { z } from "zod";

import { loadWorkflows } from "@/ai/data/loadWorkflows";

import { AiDashboard } from "./AiDashboard";

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { allUsers } = z
    .object({
      allUsers: z.string().optional(), // root-only flag
    })
    .parse(await searchParams);

  const page = await loadWorkflows({
    allUsers: !!allUsers,
  });

  return (
    <SessionProvider>
      <AiDashboard initialWorkflows={page} key={allUsers} />
    </SessionProvider>
  );
}
