import truncate from "lodash/truncate";
import Link from "next/link";
import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { MarkdownViewer } from "@quri/squiggle-components";
import { CodeBracketSquareIcon } from "@quri/ui";

import { PrivateBadge, UpdatedStatus } from "@/components/EntityCard";
import { exportTypeIcon } from "@/lib/typeIcon";
import { modelRoute, variableRoute } from "@/routes";

import { VariableCard$key } from "@/__generated__/VariableCard.graphql";

const Fragment = graphql`
  fragment VariableCard on Variable {
    id
    variableName
    currentRevision {
      id
      title
      docstring
      variableType
      modelRevision {
        createdAtTimestamp
      }
    }
    owner {
      slug
    }
    model {
      slug
      isPrivate
    }
  }
`;

type Props = {
  variableRef: VariableCard$key;
};

export const VariableCard: FC<Props> = ({ variableRef }) => {
  const variable = useFragment(Fragment, variableRef);

  const currentRevision = variable.currentRevision;

  if (!currentRevision) {
    return null;
  }

  const Icon = exportTypeIcon(currentRevision.variableType || "");

  // This will have problems with markdown tags, but I looked into markdown-truncation packages, and they can get complicated. Will try this for now.
  const docstring =
    (currentRevision.docstring &&
      truncate(currentRevision.docstring, {
        length: 500,
        separator: " ",
        omission: "...",
      })) ||
    undefined;

  const { createdAtTimestamp } = currentRevision.modelRevision;

  return (
    <>
      <div className="flex flex-col overflow-hidden">
        <div className="mb-1 px-4">
          <Link
            className="text-gray-900 font-medium hover:underline"
            href={variableRoute({
              modelSlug: variable.model.slug,
              variableName: variable.variableName,
              owner: variable.owner.slug,
            })}
          >
            {variable.currentRevision?.title || variable.variableName}
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-500 text-xs mb-3 px-4 overflow-hidden">
          <a
            className="cursor-pointer items-center flex text-xs text-gray-500 hover:text-gray-900 hover:underline"
            href={modelRoute({
              owner: variable.owner.slug,
              slug: variable.model.slug,
            })}
          >
            <CodeBracketSquareIcon size={12} className="mr-1" />
            {`${variable.owner.slug}/${variable.model.slug}`}
          </a>
          <div className="items-center flex text-xs text-gray-500">
            <Icon size={10} className="mr-1" />
            {currentRevision.variableType}
          </div>
          <UpdatedStatus time={createdAtTimestamp} />
          {variable.model.isPrivate && <PrivateBadge />}
        </div>
        {docstring && (
          <div className="border border-gray-200 rounded-md">
            <div className="px-4 py-1 overflow-hidden text-xs">
              <MarkdownViewer
                md={docstring}
                textSize="xs"
                background-color=""
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};
