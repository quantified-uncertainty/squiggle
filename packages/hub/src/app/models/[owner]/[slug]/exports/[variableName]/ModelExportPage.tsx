"use client";
import clsx from "clsx";
import { format } from "date-fns";
import { FC, useState } from "react";
import { graphql } from "react-relay";

import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";

import { SquiggleModelExportPage } from "./SquiggleModelExportPage";

import { ModelExportPageQuery } from "@/__generated__/ModelExportPageQuery.graphql";

type ExportRevisions = ModelExportPageQuery["response"]["model"] extends infer T
  ? T extends { exportRevisions: infer R }
    ? R
    : never
  : never;

const RevisionsPanel: FC<{
  exportRevisions: ExportRevisions;
  selected: string;
  changeId: (id: string) => void;
}> = ({ exportRevisions, selected, changeId }) => {
  return (
    <div className="w-[150px] ml-4 bg-gray-50 rounded-sm py-2 px-3 flex flex-col">
      <h3 className="text-sm font-medium text-gray-700 border-b mb-1 pb-0.5">
        Revisions
      </h3>
      <ul>
        {exportRevisions.map((revision) => (
          <li
            key={revision.id}
            onClick={() => changeId(revision.id)}
            className={clsx(
              "hover:text-gray-800 cursor-pointer hover:underline text-sm pt-0.5 pb-0.5",
              revision.id === selected ? "text-blue-900" : "text-gray-400"
            )}
          >
            {format(
              new Date(revision.modelRevision.createdAtTimestamp),
              "MMM dd, yyyy"
            )}
          </li>
        ))}
      </ul>
    </div>
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

  const [selected, changeId] = useState<string>(
    model.exportRevisions.at(-1)?.id || ""
  );

  const content = model.exportRevisions.find(
    (revision) => revision.id === selected
  )?.modelRevision.content;

  if (content) {
    switch (content.__typename) {
      case "SquiggleSnippet": {
        return (
          <div className="flex">
            <div className="flex-1 w-full">
              <SquiggleModelExportPage
                variableName={params.variableName}
                contentRef={content}
                key={selected}
              />
            </div>
            <RevisionsPanel
              exportRevisions={model.exportRevisions}
              selected={selected}
              changeId={changeId}
            />
          </div>
        );
      }
      default:
        return <div>Unknown model type {content.__typename}</div>;
    }
  }
};
