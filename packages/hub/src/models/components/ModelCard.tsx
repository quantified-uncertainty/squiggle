import Link from "next/link";
import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { CodeSyntaxHighlighter, NumberShower } from "@quri/squiggle-components";
import { LockIcon } from "@quri/ui";

import { formatDate } from "@/components/EntityCard";
import {
  totalImportLength,
  VariableRevision,
  VariablesDropdown,
} from "@/lib/VariablesDropdown";
import { modelRoute, ownerRoute } from "@/routes";

import { ModelCard$key } from "@/__generated__/ModelCard.graphql";

const Fragment = graphql`
  fragment ModelCard on Model {
    id
    slug
    updatedAtTimestamp
    owner {
      __typename
      slug
    }
    isPrivate
    variables {
      variableName
      currentRevision {
        variableType
        title
      }
    }
    currentRevision {
      content {
        __typename
        ... on SquiggleSnippet {
          id
          code
          version
          seed
          autorunMode
          sampleCount
          xyPointLength
        }
      }
      relativeValuesExports {
        variableName
        definition {
          slug
        }
      }
      buildStatus
      lastBuild {
        runSeconds
      }
    }
  }
`;

type Props = {
  modelRef: ModelCard$key;
  showOwner?: boolean;
};

function keepFirstNLines(str: string, n: number) {
  const lines = str.split("\n");
  const firstNLines = lines.slice(0, n);
  return firstNLines.join("\n");
}

export const ModelCard: FC<Props> = ({ modelRef, showOwner = true }) => {
  const model = useFragment(Fragment, modelRef);

  const ownerUrl = ownerRoute({
    __typename: model.owner.__typename,
    slug: model.owner.slug,
  });
  const modelUrl = modelRoute({
    owner: model.owner.slug,
    slug: model.slug,
  });

  const variableRevisions: VariableRevision[] = model.variables.map((v) => ({
    variableName: v.variableName,
    variableType: v.currentRevision?.variableType,
    title: v.currentRevision?.title || undefined,
    docString: undefined,
  }));

  const relativeValuesExports = model.currentRevision.relativeValuesExports.map(
    ({ variableName, definition: { slug } }) => ({
      variableName,
      slug,
    })
  );

  const _totalImportLength = totalImportLength(
    variableRevisions,
    relativeValuesExports
  );
  const runSeconds = model.currentRevision.lastBuild?.runSeconds;

  const body =
    model.currentRevision.content.__typename === "SquiggleSnippet"
      ? model.currentRevision.content.code
      : undefined;
  return (
    <div className="flex flex-col overflow-hidden">
      <div className="mb-1 px-4">
        {showOwner && (
          <Link
            className="text-gray-900 font-medium hover:underline"
            href={ownerUrl}
          >
            {model.owner.slug}
          </Link>
        )}
        {showOwner ? <span className="mx-1 text-gray-400">/</span> : ""}
        <Link
          className="text-gray-900 font-medium hover:underline"
          href={modelUrl}
        >
          {model.slug}
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-gray-500 text-xs mb-3 px-4 overflow-hidden">
        {_totalImportLength > 0 ? (
          <VariablesDropdown
            variableRevisions={variableRevisions}
            relativeValuesExports={relativeValuesExports}
            owner={model.owner.slug}
            slug={model.slug}
          >
            <div className="cursor-pointer items-center flex text-xs text-gray-500 hover:text-gray-900 hover:underline">
              {`${_totalImportLength} variables`}
            </div>
          </VariablesDropdown>
        ) : null}
        <div>{model.currentRevision.buildStatus}</div>
        {runSeconds && (
          <div>
            <NumberShower number={runSeconds} precision={1} />
            {"s"}
          </div>
        )}
        {model.isPrivate && <LockIcon className="400" size={14} />}
        <div>
          <span className="mr-1">Updated</span>
          <time dateTime={new Date(model.updatedAtTimestamp).toISOString()}>
            {formatDate(new Date(model.updatedAtTimestamp))}
          </time>
        </div>
      </div>
      {body && (
        <div className="border border-gray-200 rounded-md ">
          <div className="px-4 overflow-hidden text-xs">
            <div className="overflow-x-auto">
              <CodeSyntaxHighlighter language="squiggle">
                {keepFirstNLines(body, 10)}
              </CodeSyntaxHighlighter>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
