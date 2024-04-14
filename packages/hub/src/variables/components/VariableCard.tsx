import truncate from "lodash/truncate";
import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { MarkdownViewer } from "@quri/squiggle-components";

import { EntityCard } from "@/components/EntityCard";
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

  return (
    <EntityCard
      updatedAtTimestamp={currentRevision.modelRevision.createdAtTimestamp}
      href={variableRoute({
        modelSlug: variable.model.slug,
        variableName: variable.variableName,
        owner: variable.owner.slug,
      })}
      showOwner={false}
      isPrivate={variable.model.isPrivate}
      slug={variable.currentRevision?.title || variable.variableName}
      footerItems={
        <>
          <a
            className="cursor-pointer items-center flex text-xs text-gray-500 hover:text-gray-900 hover:underline"
            href={modelRoute({
              owner: variable.owner.slug,
              slug: variable.model.slug,
            })}
          >
            {`${variable.owner.slug}/${variable.model.slug}`}
          </a>
          <div className="items-center flex text-xs text-gray-500">
            <Icon size={10} className="mr-1" />
            {currentRevision.variableType}
          </div>
        </>
      }
    >
      {docstring && (
        <div className="bg-gray-100 pb-2 pt-1">
          <div className="overflow-x-hidden overflow-y-clip max-h-48 px-4">
            <MarkdownViewer md={docstring} textSize="sm" />
          </div>
        </div>
      )}
    </EntityCard>
  );
};
