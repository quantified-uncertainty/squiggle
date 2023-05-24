"use client";

import { FC } from "react";

import { graphql, useLazyLoadQuery, usePaginationFragment } from "react-relay";
import { DefinitionList } from "./DefinitionList";
import { FrontpageDefinitionListQuery } from "@/__generated__/FrontpageDefinitionListQuery.graphql";
import { FrontpageDefinitionList$key } from "@/__generated__/FrontpageDefinitionList.graphql";

const fragment = graphql`
  fragment FrontpageDefinitionList on Query
  @argumentDefinitions(
    cursor: { type: "String" }
    count: { type: "Int", defaultValue: 20 }
  )
  @refetchable(queryName: "FrontpageDefinitionListPaginationQuery") {
    definitions(first: $count, after: $cursor)
      @connection(key: "FrontpageDefinitionList_definitions") {
      # necessary for Relay
      edges {
        __typename
      }
      ...DefinitionListFragment
    }
  }
`;

const Query = graphql`
  query FrontpageDefinitionListQuery {
    ...FrontpageDefinitionList
  }
`;

export const FrontpageDefinitionList: FC = () => {
  const definitionsRef = useLazyLoadQuery<FrontpageDefinitionListQuery>(
    Query,
    {},
    { fetchPolicy: "store-and-network" }
  );

  const {
    data: { definitions },
    loadNext,
  } = usePaginationFragment<
    FrontpageDefinitionListQuery,
    FrontpageDefinitionList$key
  >(fragment, definitionsRef);

  return (
    <div>
      <header className="font-bold text-2xl mb-2">All definitions</header>
      <DefinitionList
        connectionRef={definitions}
        showOwner={true}
        loadNext={loadNext}
      />
    </div>
  );
};
