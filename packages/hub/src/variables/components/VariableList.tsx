"use client";
import { FC } from "react";
import { graphql, useFragment } from "react-relay";

import { LoadMore } from "@/components/LoadMore";

import { VariableCard } from "./VariableCard";

import { VariableList$key } from "@/__generated__/VariableList.graphql";

const Fragment = graphql`
  fragment VariableList on VariableConnection {
    edges {
      node {
        id
        ...VariableCard
      }
    }
    pageInfo {
      hasNextPage
    }
  }
`;

type Props = {
  connectionRef: VariableList$key;
  loadNext(count: number): unknown;
};

export const VariableList: FC<Props> = ({ connectionRef, loadNext }) => {
  const connection = useFragment(Fragment, connectionRef);

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-4">
        {connection.edges.map((edge) => (
          <VariableCard key={edge.node.id} modelExportRef={edge.node} />
        ))}
      </div>
      {connection.pageInfo.hasNextPage && <LoadMore loadNext={loadNext} />}
    </div>
  );
};
