import { ViewSquiggleContentForRelativeValuesDefinition$data } from "@/__generated__/ViewSquiggleContentForRelativeValuesDefinition.graphql";

export type Cluster =
  ViewSquiggleContentForRelativeValuesDefinition$data["clusters"][0];

// TODO - should be Map
export type Clusters = {
  [k: string]: Cluster;
};

export type Item =
  ViewSquiggleContentForRelativeValuesDefinition$data["items"][0];
