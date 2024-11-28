"use server";
import { z } from "zod";

import { makeServerAction, zSlug } from "@/server/utils";

import { loadModelCard, ModelCardDTO } from "../data/card";

// data-fetching action, used in ImportTooltip
export const loadModelCardAction = makeServerAction(
  z.object({
    owner: zSlug,
    slug: zSlug,
  }),
  async ({ owner, slug }): Promise<ModelCardDTO | null> => {
    return loadModelCard({ owner, slug });
  }
);
