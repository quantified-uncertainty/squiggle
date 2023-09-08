"use client";

import { FC } from "react";
import { graphql } from "react-relay";

import { EditModelPageQuery } from "@/__generated__/EditModelPageQuery.graphql";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import { EditSquiggleSnippetModel } from "./EditSquiggleSnippetModel";

export const EditModelPage: FC<{
  query: SerializablePreloadedQuery<EditModelPageQuery>;
}> = ({ query }) => {
  const [{ model: result }] = usePageQuery(
    graphql`
      query EditModelPageQuery($input: QueryModelInput!) {
        model(input: $input) {
          __typename
          ... on Model {
            id
            currentRevision {
              content {
                __typename
              }
            }
            ...EditSquiggleSnippetModel
          }
        }
      }
    `,
    query
  );
  const model = extractFromGraphqlErrorUnion(result, "Model");
  const typename = model.currentRevision.content.__typename;

  switch (typename) {
    case "SquiggleSnippet":
      return <EditSquiggleSnippetModel modelRef={model} />;
    default:
      return <div>Unknown model type {typename}</div>;
  }
};
