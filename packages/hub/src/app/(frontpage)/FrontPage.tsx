"use client";
import { FC } from "react";
import { graphql } from "relay-runtime";

import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";

import { FrontPageModelList } from "./FrontPageModelList";

import { FrontPageQuery } from "@/__generated__/FrontPageQuery.graphql";

const Query = graphql`
  query FrontPageQuery {
    ...FrontPageModelList
  }
`;

export const FrontPage: FC<{
  query: SerializablePreloadedQuery<FrontPageQuery>;
}> = ({ query }) => {
  const [data] = usePageQuery(Query, query);

  return <FrontPageModelList dataRef={data} />;
};
