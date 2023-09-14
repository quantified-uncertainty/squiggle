"use client";

export type FormShape = {
  slug: string;
  title: string;
  items: readonly {
    id: string;
    name: string;
    description: string;
    clusterId: string | null;
  }[];
  clusters: readonly {
    id: string;
    color: string;
    recommendedUnit: string | null;
  }[];
  recommendedUnit: string | null;
};
