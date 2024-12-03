import { NextRequest } from "next/server";
import { z } from "zod";

import { loadModelCards } from "@/models/data/cards";

// We're not calling this as a server actions because it'd be too slow (server actions are sequential).
// TODO: it'd be good to use tRPC for this.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const { slug } = z
    .object({
      slug: z.string(),
    })
    .parse(Object.fromEntries(searchParams.entries()));

  const page = await loadModelCards({ ownerSlug: slug, limit: 100 });

  return Response.json({
    models: page.items,
    hasMore: !!page.loadMore,
  });
}
