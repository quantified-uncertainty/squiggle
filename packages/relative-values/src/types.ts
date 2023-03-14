export type Cluster = {
  name: string;
  color: string;
};

export type Clusters = {
  [k: string]: Cluster;
};

export type Choice = {
  id: string;
  name: string;
  clusterId?: string;
};

export type Catalog = {
  title: string;
  items: Choice[];
  clusters: Clusters;
};
