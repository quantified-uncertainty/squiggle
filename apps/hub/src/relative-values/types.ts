import { z } from "zod";

export const relativeValuesClustersSchema = z.array(
  z.object({
    id: z.string(),
    color: z.string(),
    recommendedUnit: z.string().nullable().optional(),
  })
);

export const relativeValuesItemsSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string().default(""),
    clusterId: z.string().nullable().optional(),
    description: z.string().default(""),
  })
);

export type Cluster = z.infer<typeof relativeValuesClustersSchema>[number];

// TODO - should be Map
export type Clusters = {
  [k: string]: Cluster;
};

export type Item = z.infer<typeof relativeValuesItemsSchema>[number];
