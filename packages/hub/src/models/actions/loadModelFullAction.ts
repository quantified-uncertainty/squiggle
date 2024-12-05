"use server";
import { z } from "zod";

import { actionClient } from "@/lib/server/actionClient";
import { zSlug } from "@/lib/zodUtils";

import { loadModelFull, ModelFullDTO } from "../data/full";

// Data-fetching action, used in /admin/upgrade-versions.
// Don't use this for loading models; server actions are discouraged for data fetching.
export const loadModelFullAction = actionClient
  .schema(
    z.object({
      owner: zSlug,
      slug: zSlug,
    })
  )
  .action(
    async ({ parsedInput: { owner, slug } }): Promise<ModelFullDTO | null> => {
      return loadModelFull({ owner, slug });
    }
  );
