"use client";
import { FC } from "react";
import { graphql } from "relay-runtime";

import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";

import { FrontPageDefinitionList } from "./FrontPageDefinitionList";

import { DefinitionsPageQuery } from "@/__generated__/DefinitionsPageQuery.graphql";

const Query = graphql`
  query DefinitionsPageQuery {
    ...FrontPageDefinitionList
  }
`;

export const DefinitionsPage: FC<{
  query: SerializablePreloadedQuery<DefinitionsPageQuery>;
}> = ({ query }) => {
  const [data] = usePageQuery(Query, query);

  return <FrontPageDefinitionList dataRef={data} />;
};
