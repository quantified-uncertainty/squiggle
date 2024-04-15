import Link from "next/link";
import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { CodeSyntaxHighlighter, NumberShower } from "@quri/squiggle-components";
import { LockIcon, XIcon } from "@quri/ui";

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

const keepFirstNLines = (str: string, n: number) =>
  str.split("\n").slice(0, n).join("\n");

const OwnerLink: FC<{ owner: { __typename: string; slug: string } }> = ({
  owner,
}) => (
  <Link
    className="text-gray-900 font-medium hover:underline"
    href={ownerRoute(owner)}
  >
    {owner.slug}
  </Link>
);

const ModelLink: FC<{ owner: string; slug: string }> = ({ owner, slug }) => (
  <Link
    className="text-gray-900 font-medium hover:underline"
    href={modelRoute({ owner, slug })}
  >
    {slug}
  </Link>
);

const UpdatedStatus: FC<{ updatedAtTimestamp: number }> = ({
  updatedAtTimestamp,
}) => (
  <div>
    <span className="mr-1">{"Updated"}</span>
    <time dateTime={new Date(updatedAtTimestamp).toISOString()}>
      {formatDate(new Date(updatedAtTimestamp))}
    </time>
  </div>
);

const PrivateBadge: FC = () => (
  <div className="flex items-center text-gray-500">
    <LockIcon className="mr-1" size={12} />
    Private
  </div>
);

const BuildFailedBadge: FC = () => (
  <div className="flex items-center text-red-800">
    <XIcon className="mr-1" size={12} />
    <div className="text-red-800">Build Failed</div>
  </div>
);

const RunTime: FC<{ seconds: number }> = ({ seconds }) => (
  <div>
    <NumberShower number={seconds} precision={1} />s
  </div>
);

export const ModelCard: FC<Props> = ({ modelRef, showOwner = true }) => {
  const model = useFragment(Fragment, modelRef);
  const {
    owner,
    slug,
    updatedAtTimestamp,
    isPrivate,
    variables,
    currentRevision,
  } = model;

  const variableRevisions: VariableRevision[] = variables.map((v) => ({
    variableName: v.variableName,
    variableType: v.currentRevision?.variableType,
    title: v.currentRevision?.title || undefined,
    docString: undefined,
  }));

  const relativeValuesExports = currentRevision.relativeValuesExports.map(
    ({ variableName, definition: { slug } }) => ({
      variableName,
      slug,
    })
  );

  const totalImportCount = totalImportLength(
    variableRevisions,
    relativeValuesExports
  );
  const { buildStatus, lastBuild, content } = currentRevision;
  const body =
    content.__typename === "SquiggleSnippet" ? content.code : undefined;

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="mb-1 px-4">
        {showOwner && <OwnerLink owner={owner} />}
        {showOwner && <span className="mx-1 text-gray-400">/</span>}
        <ModelLink owner={owner.slug} slug={slug} />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-500 text-xs mb-3 px-4 overflow-hidden">
        {totalImportCount > 0 && (
          <VariablesDropdown
            variableRevisions={variableRevisions}
            relativeValuesExports={relativeValuesExports}
            owner={owner.slug}
            slug={slug}
          >
            <div className="cursor-pointer items-center flex text-xs text-gray-500 hover:text-gray-900 hover:underline">
              {`${totalImportCount} variables`}
            </div>
          </VariablesDropdown>
        )}
        {isPrivate && <PrivateBadge />}
        <UpdatedStatus updatedAtTimestamp={updatedAtTimestamp} />
        {buildStatus === "Failure" && <BuildFailedBadge />}
        {lastBuild?.runSeconds && buildStatus !== "Failure" && (
          <RunTime seconds={lastBuild.runSeconds} />
        )}
      </div>
      {body && (
        <div className="border border-gray-200 rounded-md">
          <div className="px-4 overflow-hidden text-xs">
            <div className="overflow-x-auto">
              <CodeSyntaxHighlighter language="squiggle" theme="github-light">
                {keepFirstNLines(body, 10)}
              </CodeSyntaxHighlighter>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
