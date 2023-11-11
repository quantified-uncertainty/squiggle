"use client";

import { FC } from "react";
import { graphql, useFragment } from "react-relay";

import { ViewModelPageQuery } from "@/__generated__/ViewModelPageQuery.graphql";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import { VersionedSquigglePlayground } from "@quri/versioned-playground";

import {
  serializeSourceId,
  squiggleHubLinker,
} from "@/squiggle/components/linker";
import { ViewSquiggleSnippet$key } from "@/__generated__/ViewSquiggleSnippet.graphql";
import { SquiggleChart } from "@quri/squiggle-components";

type Props = {
  dataRef: ViewSquiggleSnippet$key;
  params: {
    owner: string;
    slug: string;
    variableName: string;
  };
};

export const ViewSquiggleSnippet: FC<Props> = ({ dataRef, params }) => {
  const content = useFragment(
    graphql`
      fragment ViewSquiggleSnippet on SquiggleSnippet {
        id
        code
      }
    `,
    dataRef
  );

  return (
    <SquiggleChart
      code={content.code}
      showHeader={false}
      globalSelectVariableName={params.variableName}
    />
  );
};

export const ModelExportPage: FC<{
  params: {
    owner: string;
    slug: string;
    variableName: string;
  };
  query: SerializablePreloadedQuery<ViewModelPageQuery>;
}> = ({ query, params }) => {
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
      return <ViewSquiggleSnippet dataRef={content} params={params} />;
    default:
      return <div>Unknown model type {typename}</div>;
  }
};
