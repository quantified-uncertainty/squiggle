"use client";
import { FC } from "react";
import { graphql, useFragment } from "react-relay";

import { LoadMore } from "@/components/LoadMore";

import { GroupCard } from "./GroupCard";

import { GroupList$key } from "@/__generated__/GroupList.graphql";

const Fragment = graphql`
  fragment GroupList on GroupConnection {
    edges {
      node {
        id
        ...GroupCard
      }
    }
    pageInfo {
      hasNextPage
    }
  }
`;

type Props = {
  connectionRef: GroupList$key;
  loadNext(count: number): unknown;
};

export const GroupList: FC<Props> = ({ connectionRef, loadNext }) => {
  const connection = useFragment(Fragment, connectionRef);

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-4">
        {connection.edges.map((edge) => (
          <GroupCard key={edge.node.id} groupRef={edge.node} />
        ))}
      </div>
      {connection.pageInfo.hasNextPage && <LoadMore loadNext={loadNext} />}
    </div>
  );
};
