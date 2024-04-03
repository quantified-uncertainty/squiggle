"use client";
import { FC } from "react";
import { graphql, useFragment } from "react-relay";

import { LoadMore } from "@/components/LoadMore";

import { ModelExportCard } from "./ModelExportCard";

import { ModelExportList$key } from "@/__generated__/ModelExportList.graphql";

const Fragment = graphql`
  fragment ModelExportList on ModelExportConnection {
    edges {
      node {
        id
        ...ModelExportCard
      }
    }
    pageInfo {
      hasNextPage
    }
  }
`;

type Props = {
  connectionRef: ModelExportList$key;
  loadNext(count: number): unknown;
};

export const ModelExportList: FC<Props> = ({ connectionRef, loadNext }) => {
  const connection = useFragment(Fragment, connectionRef);

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-4">
        {connection.edges.map((edge) => (
          <ModelExportCard key={edge.node.id} modelExportRef={edge.node} />
        ))}
      </div>
      {connection.pageInfo.hasNextPage && <LoadMore loadNext={loadNext} />}
    </div>
  );
};
