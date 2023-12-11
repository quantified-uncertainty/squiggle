"use client";
import { FC, useState } from "react";
import { graphql, useFragment } from "react-relay";

import { SqProject, SqValuePath } from "@quri/squiggle-lang";
import {
  useAdjustSquiggleVersion,
  VersionedSquiggleChart,
} from "@quri/versioned-squiggle-components";

import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import { squiggleHubLinker } from "@/squiggle/components/linker";

import { ModelExportPage_SquiggleContent$key } from "@/__generated__/ModelExportPage_SquiggleContent.graphql";
import { ModelExportPageQuery } from "@/__generated__/ModelExportPageQuery.graphql";

const SquiggleModelExportPage: FC<{
  variableName: string;
  contentRef: ModelExportPage_SquiggleContent$key;
}> = ({ variableName, contentRef }) => {
  const content = useFragment(
    graphql`
      fragment ModelExportPage_SquiggleContent on SquiggleSnippet {
        id
        code
        version
      }
    `,
    contentRef
  );

  const checkedVersion = useAdjustSquiggleVersion(content.version);

  const [project] = useState(() => {
    return new SqProject({ linker: squiggleHubLinker });
  });

  if (checkedVersion === "0.8.5" || checkedVersion === "0.8.6") {
    return (
      <div className="p-4 bg-red-100 text-red-900">
        Export view pages don&apos;t support Squiggle {checkedVersion}.
      </div>
    );
  }

  const rootPath = new SqValuePath({
    root: "bindings",
    items: [{ type: "string", value: variableName }],
  });
  return (
    <VersionedSquiggleChart
      version={checkedVersion}
      code={content.code}
      showHeader={false}
      rootPathOverride={rootPath}
      project={project}
    />
  );
};

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
                ...ModelExportPage_SquiggleContent
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
