export type Cluster = {
  name: string;
  color: string;
};

export type Clusters = {
  [k: string]: Cluster;
};

export type Item = {
  id: string;
  name: string;
  clusterId?: string;
};

export type Catalog = {
  title: string;
  items: Item[];
  clusters: Clusters;
};
