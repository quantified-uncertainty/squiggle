"use client";

import { FC } from "react";

import { FrontpageModelList$key } from "@/__generated__/FrontpageModelList.graphql";
import { FrontpageModelListQuery } from "@/__generated__/FrontpageModelListQuery.graphql";
import { graphql, useLazyLoadQuery, usePaginationFragment } from "react-relay";
import { ModelList } from "./ModelList";


const Fragment = graphql`
  fragment FrontpageModelList on Query
  @argumentDefinitions(
    cursor: { type: "String" }
    count: { type: "Int", defaultValue: 20 }
  )
  @refetchable(queryName: "FrontpageModelListPaginationQuery") {
    models(first: $count, after: $cursor)
      @connection(key: "FrontpageModelList_models") {
      # necessary for Relay
      edges {
        __typename
      }
      ...ModelListFragment
    }
  }
`;

const Query = graphql`
  query FrontpageModelListQuery {
    ...FrontpageModelList
  }
`;

export const FrontpageModelList: FC = () => {
  const fragment = useLazyLoadQuery<FrontpageModelListQuery>(
    Query,
    {},
    { fetchPolicy: "store-and-network" }
  );

  const {
    data: { models },
    loadNext,
  } = usePaginationFragment<FrontpageModelListQuery, FrontpageModelList$key>(
    Fragment,
    fragment
  );

  return (
    <div>
      <header className="font-bold text-2xl mb-2">All models</header>
      <ModelList connection={models} showOwner={true} loadNext={loadNext} />
    </div>
  );
};
