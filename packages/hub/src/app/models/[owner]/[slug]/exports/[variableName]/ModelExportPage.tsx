"use client";

import { FC } from "react";
import { graphql } from "react-relay";

import { ModelExportPageQuery } from "@/__generated__/ModelExportPageQuery.graphql";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import { SquiggleChart } from "@quri/squiggle-components";
import { SqValuePath } from "@quri/squiggle-lang";

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
      query ModelExportPageQuery($input: QueryModelInput!) {
        model(input: $input) {
          __typename
          ... on Model {
            id
            slug
            currentRevision {
              id
              content {
                __typename
                ... on SquiggleSnippet {
                  id
                  code
                  version
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
      const rootPath = new SqValuePath({
        root: "bindings",
        items: [{ type: "string", value: params.variableName }],
      });
      return (
        <SquiggleChart
          code={content.code}
          showHeader={false}
          rootPathOverride={rootPath}
        />
      );
    }
    default:
      return <div>Unknown model type {content.__typename}</div>;
  }
};
