"use client";
import { FC } from "react";
import { graphql, useFragment } from "react-relay";

import { ModelList$key } from "@/__generated__/ModelList.graphql";
import { LoadMore } from "@/components/LoadMore";
import { ModelCard } from "./ModelCard";

const Fragment = graphql`
  fragment ModelList on ModelConnection {
    edges {
      node {
        id
        ...ModelCard
      }
    }
    pageInfo {
      hasNextPage
    }
  }
`;

type Props = {
  connectionRef: ModelList$key;
  loadNext(count: number): unknown;
  showOwner?: boolean;
};

export const ModelList: FC<Props> = ({
  connectionRef,
  loadNext,
  showOwner,
}) => {
  const connection = useFragment(Fragment, connectionRef);

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-4">
        {connection.edges.map((edge) => (
          <ModelCard
            key={edge.node.id}
            modelRef={edge.node}
            showOwner={showOwner}
          />
        ))}
      </div>
      {connection.pageInfo.hasNextPage && <LoadMore loadNext={loadNext} />}
    </div>
  );
};
