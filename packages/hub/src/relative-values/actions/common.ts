import { z } from "zod";

import { zColor, zSlug } from "@/lib/zodUtils";

// Appropriate both for create and update actions.
export const inputSchema = z.object({
  owner: zSlug.optional(),
  slug: zSlug,
  title: z.string(),
  items: z.array(
    z.object({
      id: zSlug,
      name: z.string(),
      description: z.string().optional(),
      clusterId: z.string().optional(),
    })
  ),
  clusters: z.array(
    z.object({
      id: zSlug,
      color: zColor,
      recommendedUnit: zSlug.optional(),
    })
  ),
  recommendedUnit: zSlug.optional(),
});

export type Input = z.infer<typeof inputSchema>;

export async function validateRelativeValuesDefinition({
  items,
  clusters,
  recommendedUnit,
}: {
  items: Input["items"];
  clusters: Input["clusters"];
  recommendedUnit: Input["recommendedUnit"];
}) {
  if (!items.length) {
    throw new Error("RelativeValuesDefinition must include at least one item");
  }

  const itemIds = new Set<string>();
  for (const item of items) {
    if (itemIds.has(item.id)) {
      throw new Error(`Duplicate item id ${item.id}`);
    }
    if (!item.id.match(/^\w[\w\-]*$/)) {
      throw new Error(`Invalid item id ${item.id}`);
    }
    itemIds.add(item.id);
  }

  const checkId = (id: string | null | undefined) => {
    if (id !== null && id !== undefined && !itemIds.has(id)) {
      throw new Error(`id ${id} not found in items`);
    }
  };

  for (const cluster of clusters) {
    checkId(cluster.recommendedUnit);
  }
  checkId(recommendedUnit);
}
