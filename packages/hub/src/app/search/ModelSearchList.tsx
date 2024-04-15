"use client";

import { FC } from "react";
import { graphql, usePaginationFragment } from "react-relay";

import { ModelList } from "@/models/components/ModelList";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";

import { ModelSearchList$key } from "@/__generated__/ModelSearchList.graphql";
import { ModelSearchListPaginationQuery } from "@/__generated__/ModelSearchListPaginationQuery.graphql";
import { ModelSearchListQuery } from "@/__generated__/ModelSearchListQuery.graphql";

const Query = graphql`
  query ModelSearchListQuery {
    ...ModelSearchList
  }
`;

export const Search: FC<{
  query: SerializablePreloadedQuery<ModelSearchListQuery>;
}> = ({ query }) => {
  const [data] = usePageQuery(Query, query);

  return (
    <div className="space-y-8">
      <ModelSearchList dataRef={data} />
    </div>
  );
};

const Fragment = graphql`
  fragment ModelSearchList on Query
  @argumentDefinitions(
    cursor: { type: "String" }
    count: { type: "Int", defaultValue: 20 }
  )
  @refetchable(queryName: "ModelSearchListPaginationQuery") {
    models(first: $count, after: $cursor)
      @connection(key: "ModelSearchList_models") {
      # necessary for Relay
      edges {
        __typename
      }
      ...ModelList
    }
  }
`;

type ModelSearchListProps = {
  dataRef: ModelSearchList$key;
};

export const ModelSearchList: FC<ModelSearchListProps> = ({ dataRef }) => {
  const {
    data: { models },
    loadNext,
  } = usePaginationFragment<
    ModelSearchListPaginationQuery,
    ModelSearchList$key
  >(Fragment, dataRef);

  return (
    <ModelList connectionRef={models} showOwner={true} loadNext={loadNext} />
  );
};
