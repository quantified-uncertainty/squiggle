import { z } from "zod";

export const relativeValuesClusterSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  color: z.string(),
  recommendedUnit: z.string().nullable().optional(),
});

export const relativeValuesClustersSchema = z.array(
  relativeValuesClusterSchema
);

export const relativeValuesItemSchema = z.object({
  id: z.string(),
  name: z.string().default(""),
  clusterId: z.string().nullable().optional(),
  description: z.string().default(""),
});

export const relativeValuesItemsSchema = z.array(relativeValuesItemSchema);

export const relativeValuesDefinitionSchema = z.object({
  title: z.string().default(""),
  items: relativeValuesItemsSchema,
  clusters: relativeValuesClustersSchema.default([]),
  recommendedUnit: z.string().nullable().optional(),
});

export type Cluster = z.infer<typeof relativeValuesClusterSchema>;

export type Clusters = {
  [k: string]: Cluster;
};

export type Item = z.infer<typeof relativeValuesItemSchema>;

/**
 * Everything that the views need to know about the items being compared.
 *
 * Squiggle Hub stores this as a "relative values definition"; in Squiggle
 * code, it's described by the `{ title, items, clusters, recommendedUnit }`
 * fields of a relative values spec.
 */
export type RelativeValuesDefinition = {
  title: string;
  items: Item[];
  clusters: Cluster[];
  recommendedUnit?: string | null;
};
