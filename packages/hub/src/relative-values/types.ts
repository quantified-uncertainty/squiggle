import { z } from "zod";

import { RelativeValuesDefinitionRevision$data } from "@/__generated__/RelativeValuesDefinitionRevision.graphql";

export type Cluster = RelativeValuesDefinitionRevision$data["clusters"][0];

// TODO - should be Map
export type Clusters = {
  [k: string]: Cluster;
};

export type Item = RelativeValuesDefinitionRevision$data["items"][0];

// used in GraphQL schema
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
