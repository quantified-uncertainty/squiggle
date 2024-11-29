import { FC } from "react";

import { MarkdownViewer } from "@quri/squiggle-components";
import { CodeBracketSquareIcon } from "@quri/ui";

import {
  EntityCardBadge,
  entityCardBadgeCss,
  InterspersedMenuItemsWithDots,
  keepFirstNLines,
  PrivateBadge,
  UpdatedStatus,
} from "@/components/EntityCard";
import { Link } from "@/components/ui/Link";
import { exportTypeIcon } from "@/lib/typeIcon";
import { modelRoute, variableRoute } from "@/routes";
import { VariableCardDTO } from "@/server/variables/data/variableCards";

type Props = {
  variable: VariableCardDTO;
};

export const VariableCard: FC<Props> = ({ variable }) => {
  const currentRevision = variable.currentRevision;

  if (!currentRevision) {
    return null;
  }

  const Icon = exportTypeIcon(currentRevision.variableType || "");

  // This will have problems with markdown tags, but I looked into markdown-truncation packages, and they can get complicated. Will try this for now.

  const { createdAt } = currentRevision.modelRevision;

  return (
    <div className="flex flex-col">
      <div className="flex-grow px-2">
        <div className="mb-1">
          <Link
            className="font-medium text-gray-900 hover:underline"
            href={variableRoute({
              modelSlug: variable.model.slug,
              variableName: variable.variableName,
              owner: variable.model.owner.slug,
            })}
          >
            {variable.currentRevision?.title || variable.variableName}
          </Link>
        </div>
        <div className="mb-1 text-sm text-gray-500">
          <a
            className={entityCardBadgeCss(true)}
            href={modelRoute({
              owner: variable.model.owner.slug,
              slug: variable.model.slug,
            })}
          >
            <CodeBracketSquareIcon size={12} className="mr-1" />
            {`${variable.model.owner.slug}/${variable.model.slug}`}
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
          <InterspersedMenuItemsWithDots
            items={[
              <EntityCardBadge presentAsLink={false} key={"variable-type"}>
                <Icon size={10} className="mr-1" />
                {currentRevision.variableType}
              </EntityCardBadge>,
              <UpdatedStatus time={createdAt.getTime()} key={"updated-at"} />,
              variable.model.isPrivate && <PrivateBadge key={"is-private"} />,
            ]}
          />
        </div>
      </div>
      {currentRevision.docstring && (
        <div className="mt-3 rounded-md bg-gray-50">
          <div className="px-2 py-1 text-xs text-gray-600">
            <MarkdownViewer
              md={keepFirstNLines(currentRevision.docstring, 10)}
              textSize="xs"
              background-color=""
            />
          </div>
        </div>
      )}
    </div>
  );
};
