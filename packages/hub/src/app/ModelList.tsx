"use client";

import { FC } from "react";

import { ModelListFragment$key } from "@/__generated__/ModelListFragment.graphql";
import { graphql, useFragment } from "react-relay";
import { ModelCard } from "./ModelCard";

const fragment = graphql`
  fragment ModelListFragment on ModelConnection {
    edges {
      node {
        id
        ...ModelCardFragment
      }
    }
    pageInfo {
      hasNextPage
    }
  }
`;

type Props = {
  connection: ModelListFragment$key;
  showOwner?: boolean;
};

export const ModelList: FC<Props> = ({ connection, showOwner }) => {
  const data = useFragment(fragment, connection);

  return (
    <div>
      {data.edges.map((edge) => (
        <ModelCard key={edge.node.id} model={edge.node} showOwner={showOwner} />
      ))}
      {data.pageInfo.hasNextPage && (
        <div>{"There's more, but pagination is not implemented yet"}</div>
      )}
    </div>
  );
};
