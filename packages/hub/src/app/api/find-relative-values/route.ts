import { NextRequest } from "next/server";
import { z } from "zod";

import { findRelativeValuesForSelect } from "@/server/relative-values/data/findRelativeValuesForSelect";

// We're not calling this as a server actions because it'd be too slow (server actions are sequential).
// TODO: it'd be good to use tRPC for this.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const { owner, slugContains } = z
    .object({
      owner: z.string(),
      slugContains: z.string(),
    })
    .parse(Object.fromEntries(searchParams.entries()));

  return Response.json(
    await findRelativeValuesForSelect({
      owner,
      slugContains,
    })
  );
}
