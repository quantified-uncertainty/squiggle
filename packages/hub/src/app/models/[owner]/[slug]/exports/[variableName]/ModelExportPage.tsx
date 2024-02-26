"use client";
import { FC } from "react";
import { graphql } from "react-relay";

import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";

import { SquiggleModelExportPage } from "./SquiggleModelExportPage";

import { ModelExportPageQuery } from "@/__generated__/ModelExportPageQuery.graphql";

export const ModelExportPage: FC<{
  params: {
    owner: string;
    slug: string;
    variableName: string;
  };
  query: SerializablePreloadedQuery<ModelExportPageQuery>;
}> = ({ query, params }) => {
  const [{ model: result }] = usePageQuery(
    graphql`
      query ModelExportPageQuery(
        $input: QueryModelInput!
        $variableName: String!
      ) {
        model(input: $input) {
          __typename
          ... on Model {
            id
            slug
            currentRevision {
              id
              content {
                __typename
                ...SquiggleModelExportPage
              }
            }
            exportRevisions(variableId: $variableName) {
              id
              variableName
              modelRevision {
                id
                createdAtTimestamp
                content {
                  __typename
                  ...SquiggleModelExportPage
                }
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

  switch (content.__typename) {
    case "SquiggleSnippet": {
      return (
        <SquiggleModelExportPage
          variableName={params.variableName}
          contentRef={content}
        />
      );
    }
    default:
      return <div>Unknown model type {content.__typename}</div>;
  }
};
