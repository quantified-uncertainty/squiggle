"use client";

import { ModelListQuery } from "@gen/ModelListQuery.graphql";
import { FC } from "react";

import { graphql, useLazyLoadQuery } from "react-relay";
import { ModelCard } from "./ModelCard";

const ModelListQuery = graphql`
  query ModelListQuery {
    models {
      edges {
        node {
          id
          ...ModelCardFragment
        }
      }
    }
  }
`;

export const ModelList: FC = () => {
  const data = useLazyLoadQuery<ModelListQuery>(ModelListQuery, {});

  return (
    <div>
      {data.models.edges.map((edge) => (
        <ModelCard key={edge.node.id} model={edge.node} />
      ))}
    </div>
  );
};
