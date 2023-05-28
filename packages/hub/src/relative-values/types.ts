import { RelativeValuesDefinitionRevision$data } from "@/__generated__/RelativeValuesDefinitionRevision.graphql";

export type Cluster = RelativeValuesDefinitionRevision$data["clusters"][0];

// TODO - should be Map
export type Clusters = {
  [k: string]: Cluster;
};

export type Item = RelativeValuesDefinitionRevision$data["items"][0];
