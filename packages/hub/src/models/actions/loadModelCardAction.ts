"use server";
import { z } from "zod";

import { actionClient } from "@/lib/server/actionClient";
import { zSlug } from "@/lib/zodUtils";

import { loadModelCard, ModelCardDTO } from "../data/cards";

// Data-fetching action, used in ImportTooltip.
// Don't use this for loading models; server actions are discouraged for data fetching.
export const loadModelCardAction = actionClient
  .schema(
    z.object({
      owner: zSlug,
      slug: zSlug,
    })
  )
  .action(
    async ({ parsedInput: { owner, slug } }): Promise<ModelCardDTO | null> => {
      return loadModelCard({ owner, slug });
    }
  );
