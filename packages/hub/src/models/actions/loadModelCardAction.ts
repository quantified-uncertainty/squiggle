"use server";
import { z } from "zod";

import { makeServerAction } from "@/lib/server/utils";
import { zSlug } from "@/lib/zodUtils";

import { loadModelCard, ModelCardDTO } from "../data/cards";

// Data-fetching action, used in ImportTooltip.
// Don't use this for loading models; server actions are discouraged for data fetching.
export const loadModelCardAction = makeServerAction(
  z.object({
    owner: zSlug,
    slug: zSlug,
  }),
  async ({ owner, slug }): Promise<ModelCardDTO | null> => {
    return loadModelCard({ owner, slug });
  }
);
