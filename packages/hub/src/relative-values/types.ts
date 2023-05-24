import { ViewSquiggleContentForRelativeValuesDefinition$data } from "@/__generated__/ViewSquiggleContentForRelativeValuesDefinition.graphql";
import { Model } from "./model/utils";
import { Map } from "immutable";

export type Cluster =
  ViewSquiggleContentForRelativeValuesDefinition$data["clusters"][0];

// TODO - should be Map
export type Clusters = {
  [k: string]: Cluster;
};

export type Item =
  ViewSquiggleContentForRelativeValuesDefinition$data["items"][0];

export type Catalog = ViewSquiggleContentForRelativeValuesDefinition$data;

export type InterfaceWithModels = {
  catalog: Catalog;
  models: Map<string, Model>;
};

export type InterfaceWithModelsArrays = {
  catalog: Catalog;
  models: Model[];
};
