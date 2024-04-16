"use client";
import clsx from "clsx";
import { format } from "date-fns";
import Link from "next/link";
import { FC, useState } from "react";
import { FaClock, FaMinusCircle } from "react-icons/fa";
import { graphql, usePaginationFragment } from "react-relay";
import { FragmentRefs } from "relay-runtime";

import { CheckIcon, XIcon } from "@quri/ui";

import { LoadMore } from "@/components/LoadMore";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { exportTypeIcon } from "@/lib/typeIcon";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";

import { SquiggleVariableRevisionPage } from "./SquiggleVariableRevisionPage";

import {
  VariablePage$data,
  VariablePage$key,
} from "@/__generated__/VariablePage.graphql";
import { VariablePageQuery } from "@/__generated__/VariablePageQuery.graphql";

const buildStatusIcon = (status: string) => {
  switch (status) {
    case "Success":
      return <CheckIcon className="text-green-700 opacity-30" />;
    case "Failure":
      return <XIcon className="text-red-500" />;
    case "Pending":
      return <FaClock className="text-yellow-500" />;
    case "Skipped":
      return <FaMinusCircle className="text-gray-500" />;
  }
};

type VariableRevisions = VariablePage$data["revisions"];
const VariableRevisionsPanel: FC<{
  revisions: VariableRevisions;
  selected: string;
  changeId: (id: string) => void;
  loadNext?: (count: number) => void;
}> = ({ revisions, selected, changeId, loadNext }) => {
  return (
    <div className="ml-4 flex flex-col rounded-sm bg-gray-50 px-3 py-2">
      <h3 className="mb-1 border-b pb-0.5 text-sm font-medium text-gray-700">
        Revisions
      </h3>
      <div className="w-full">
        {revisions.edges.map(({ node: revision }) => {
          const Icon = exportTypeIcon(revision.variableType || "");
          return (
            <div
              key={revision.id}
              className={clsx(
                "flex items-center justify-between pb-0.5 pt-0.5 text-sm"
              )}
            >
              <div
                className={clsx(
                  "w-8/10 cursor-pointer pr-2 hover:text-gray-800 hover:underline",
                  revision.id === selected ? "text-blue-900" : "text-gray-400"
                )}
              >
                <Link
                  href="#"
                  className="block"
                  onClick={() => changeId(revision.id)}
                >
                  {format(
                    new Date(revision.modelRevision.createdAtTimestamp),
                    "MMM dd h:mm a"
                  )}
                </Link>
              </div>
              <div className="w-1/10 flex items-center justify-end pr-1 text-gray-400">
                <Icon size={10} />
              </div>
              <div className="w-1/10 flex items-center justify-end">
                {buildStatusIcon(revision.modelRevision.buildStatus)}
              </div>
            </div>
          );
        })}
      </div>
      {loadNext && <LoadMore loadNext={loadNext} size="small" />}
    </div>
  );
};

export const VariablePageBody: FC<{
  variableName: string;
  result: {
    readonly __typename: "Variable";
    readonly id: string;
    readonly variableName: string;
    readonly " $fragmentSpreads": FragmentRefs<"VariablePage">;
  };
}> = ({ result, variableName }) => {
  const variable = extractFromGraphqlErrorUnion(result, "Variable");

  const {
    data: { revisions },
    loadNext,
  } = usePaginationFragment<VariablePageQuery, VariablePage$key>(
    graphql`
      fragment VariablePage on Variable
      @argumentDefinitions(
        cursor: { type: "String" }
        count: { type: "Int", defaultValue: 20 }
      )
      @refetchable(queryName: "VariablePagePaginationQuery") {
        revisions(first: $count, after: $cursor)
          @connection(key: "VariablePage_revisions") {
          edges {
            node {
              id
              variableName
              variableType
              modelRevision {
                id
                createdAtTimestamp
                content {
                  __typename
                  ...SquiggleVariableRevisionPage
                }
                buildStatus
              }
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    `,
    variable
  );

  const [selected, changeId] = useState<string | null>(
    revisions.edges.at(0)?.node.id ?? null
  );

  if (selected === null) {
    return <div>No revisions found. They should be built shortly.</div>;
  }

  const content = revisions.edges.find((edge) => edge.node.id === selected)
    ?.node.modelRevision.content;

  if (content) {
    switch (content.__typename) {
      case "SquiggleSnippet": {
        return (
          <div className="flex">
            <div className="w-full flex-1">
              <SquiggleVariableRevisionPage
                key={selected}
                variableName={variableName}
                contentRef={content}
              />
            </div>
            <VariableRevisionsPanel
              revisions={revisions}
              selected={selected}
              changeId={changeId}
              loadNext={revisions.pageInfo.hasNextPage ? loadNext : undefined}
            />
          </div>
        );
      }
      default:
        return <div>Unknown model type {content.__typename}</div>;
    }
  }
};

export const VariablePage: FC<{
  params: {
    owner: string;
    slug: string;
    variableName: string;
  };
  query: SerializablePreloadedQuery<VariablePageQuery>;
}> = ({ query, params }) => {
  const [{ variable: result }] = usePageQuery(
    graphql`
      query VariablePageQuery($input: QueryVariableInput!) {
        variable(input: $input) {
          __typename
          ... on Variable {
            id
            variableName
            ...VariablePage
          }
        }
      }
    `,
    query
  );

  if (result.__typename !== "Variable") {
    return <div>No revisions found. They should be built shortly.</div>;
  }

  return (
    <VariablePageBody variableName={params.variableName} result={result} />
  );
};
