"use client";

import { FC } from "react";
import { graphql, useFragment } from "react-relay";

import { ModelExportPageQuery } from "@/__generated__/ModelExportPageQuery.graphql";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import { SquiggleChart } from "@quri/squiggle-components";

// export const ModelExportPageCode: FC<Props> = ({ dataRef, params }) => {
//   return (
//     <SquiggleChart
//       code={content.code}
//       showHeader={false}
//       globalSelectVariableName={params.variableName}
//     />
//   );
// };

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
    case "SquiggleSnippet":
      return (
        <SquiggleChart
          code={content.code}
          showHeader={false}
          globalSelectVariableName={params.variableName}
        />
      );
    default:
      return <div>Unknown model type {content.__typename}</div>;
  }
};
