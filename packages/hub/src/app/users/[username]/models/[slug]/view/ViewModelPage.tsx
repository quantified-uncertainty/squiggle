"use client";

import { FC } from "react";
import { graphql } from "react-relay";

import { ViewModelPageQuery } from "@/__generated__/ViewModelPageQuery.graphql";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import { ViewSquiggleSnippet } from "@/squiggle/components/ViewSquiggleSnippet";

export const ViewModelPage: FC<{
  query: SerializablePreloadedQuery<ViewModelPageQuery>;
}> = ({ query }) => {
  const [{ model: result }] = usePageQuery(
    graphql`
      query ViewModelPageQuery($input: QueryModelInput!) {
        model(input: $input) {
          __typename
          ... on Model {
            id
            slug
            currentRevision {
              content {
                ...ViewSquiggleSnippet
                __typename
              }
            }
          }
        }
      }
    `,
    query
  );

  const model = extractFromGraphqlErrorUnion(result, "Model");

  const content = model.currentRevision.content;
  const typename = content.__typename;

  switch (typename) {
    case "SquiggleSnippet":
      return <ViewSquiggleSnippet dataRef={content} />;
    default:
      return <div>Unknown model type {typename}</div>;
  }
};
