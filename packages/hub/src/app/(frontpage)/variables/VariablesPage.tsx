"use client";
import { FC } from "react";
import { graphql } from "relay-runtime";

import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";

import { FrontPageVariableList } from "./FrontPageVariableList";

import { VariablesPageQuery } from "@/__generated__/VariablesPageQuery.graphql";

const Query = graphql`
  query VariablesPageQuery {
    ...FrontPageVariableList
  }
`;

export const VariablesPage: FC<{
  query: SerializablePreloadedQuery<VariablesPageQuery>;
}> = ({ query }) => {
  const [data] = usePageQuery(Query, query);

  return <FrontPageVariableList dataRef={data} />;
};
