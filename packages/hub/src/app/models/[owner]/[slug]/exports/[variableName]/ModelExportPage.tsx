"use client";
import clsx from "clsx";
import { format } from "date-fns";
import { FC, useState } from "react";
import { graphql, usePaginationFragment } from "react-relay";

import { LoadMore } from "@/components/LoadMore";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";

import { SquiggleModelExportPage } from "./SquiggleModelExportPage";

import {
  ModelExportPage$data,
  ModelExportPage$key,
} from "@/__generated__/ModelExportPage.graphql";
import { ModelExportPageQuery } from "@/__generated__/ModelExportPageQuery.graphql";

type ExportRevisions = ModelExportPage$data["exportRevisions"];

const RevisionsPanel: FC<{
  exportRevisions: ExportRevisions;
  selected: string;
  changeId: (id: string) => void;
  loadNext?: (count: number) => void;
}> = ({ exportRevisions, selected, changeId, loadNext }) => {
  return (
    <div className="w-[150px] ml-4 bg-gray-50 rounded-sm py-2 px-3 flex flex-col">
      <h3 className="text-sm font-medium text-gray-700 border-b mb-1 pb-0.5">
        Revisions
      </h3>
      <ul>
        {exportRevisions.edges.map(({ node: revision }) => (
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
      {loadNext && <LoadMore loadNext={loadNext} size="small" />}
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
            ...ModelExportPage @arguments(variableName: $variableName)
          }
        }
      }
    `,
    query
  );

  const model = extractFromGraphqlErrorUnion(result, "Model");

  const {
    data: { exportRevisions },
    loadNext,
  } = usePaginationFragment<ModelExportPageQuery, ModelExportPage$key>(
    graphql`
      fragment ModelExportPage on Model
      @argumentDefinitions(
        cursor: { type: "String" }
        count: { type: "Int", defaultValue: 20 }
        variableName: { type: "String!" }
      )
      @refetchable(queryName: "ModelExportPagePaginationQuery") {
        exportRevisions(
          first: $count
          after: $cursor
          variableId: $variableName
        ) @connection(key: "ModelExportPage_exportRevisions") {
          edges {
            node {
              id
              variableName
              modelRevision {
                id
                createdAtTimestamp
                buildStatus
                content {
                  __typename
                  ...SquiggleModelExportPage
                }
              }
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    `,
    model
  );

  const [selected, changeId] = useState<string>(
    exportRevisions.edges.at(0)?.node.id || ""
  );

  const content = exportRevisions.edges.find(
    (edge) => edge.node.id === selected
  )?.node.modelRevision.content;

  if (content) {
    switch (content.__typename) {
      case "SquiggleSnippet": {
        return (
          <div className="flex">
            <div className="flex-1 w-full">
              <SquiggleModelExportPage
                key={selected}
                variableName={params.variableName}
                contentRef={content}
              />
            </div>
            <RevisionsPanel
              exportRevisions={exportRevisions}
              selected={selected}
              changeId={changeId}
              loadNext={
                exportRevisions.pageInfo.hasNextPage ? loadNext : undefined
              }
            />
          </div>
        );
      }
      default:
        return <div>Unknown model type {content.__typename}</div>;
    }
  }
};
