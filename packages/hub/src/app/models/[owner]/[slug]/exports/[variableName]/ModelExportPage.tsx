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
    model.exportRevisions.at(-1)!.id
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
            <div className="w-[200px] ml-4">
              <div className="flex flex-col">
                <h3 className="text-sm font-medium text-gray-700 border-b mb-1 pb-0.5">
                  Revisions
                </h3>
                <ul>
                  {model.exportRevisions.toReversed().map((revision) => (
                    <li
                      key={revision.id}
                      onClick={() => changeId(revision.id)}
                      className={clsx(
                        "hover:text-gray-900 cursor-pointer hover:underline text-sm pt-0.5 pb-0.5",
                        revision.id === selected
                          ? "text-blue-900"
                          : "text-gray-400"
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
            </div>
          </div>
        );
      }
      default:
        return <div>Unknown model type {content.__typename}</div>;
    }
  }
};
