import { NextRequest } from "next/server";
import { z } from "zod";

import { findOwnersForSelect } from "@/server/owners/data";

// We're not calling this as a server actions because it'd be too slow (server actions are sequential).
// TODO: it'd be good to use tRPC for this.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const { search, mode } = z
    .object({
      search: z.string(),
      mode: z.enum(["all", "all-users", "all-groups", "my", "my-groups"]),
    })
    .parse(Object.fromEntries(searchParams.entries()));

  return Response.json(
    await findOwnersForSelect({
      search,
      mode,
    })
  );
}
