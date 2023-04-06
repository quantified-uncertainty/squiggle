import { Model } from "./model/utils";
import { Map } from "immutable";

export type Cluster = {
  name: string;
  color: string;
};

// TODO - should be Map
export type Clusters = {
  [k: string]: Cluster;
};

export type Item = {
  id: string;
  name: string;
  clusterId?: string;
  description?: string;
};

export type Catalog = {
  id: string;
  title: string;
  description?: string;
  created?: Date;
  author?: string;
  items: Item[];
  recommendedUnit?: string; // id of one of the items
  clusters: Clusters;
};

export type InterfaceWithModels = {
  catalog: Catalog;
  models: Map<string, Model>;
};

export type InterfaceWithModelsArrays = {
  catalog: Catalog;
  models: Model[];
};
