import { FC } from "react";

import { CodeSyntaxHighlighter, NumberShower } from "@quri/squiggle-components";
import { XIcon } from "@quri/ui";

import {
  EntityCardBadge,
  InterspersedMenuItemsWithDots,
  keepFirstNLines,
  PrivateBadge,
  UpdatedStatus,
} from "@/components/EntityCard";
import { Link } from "@/components/ui/Link";
import {
  totalImportLength,
  VariableRevision,
  VariablesDropdown,
} from "@/lib/VariablesDropdown";
import { modelRoute, ownerRoute } from "@/routes";
import { ModelCardData } from "@/server/models/data";

type Props = {
  model: ModelCardData;
  showOwner?: boolean;
};

const OwnerLink: FC<{ owner: { __typename: string; slug: string } }> = ({
  owner,
}) => (
  <Link
    className="font-medium text-gray-900 hover:underline"
    href={ownerRoute(owner)}
  >
    {owner.slug}
  </Link>
);

const ModelLink: FC<{ owner: string; slug: string }> = ({ owner, slug }) => (
  <Link
    className="font-medium text-gray-900 hover:underline"
    href={modelRoute({ owner, slug })}
  >
    {slug}
  </Link>
);

const BuildFailedBadge: FC = () => (
  <div className="flex items-center text-red-800">
    <XIcon className="mr-1" size={10} />
    <div className="text-red-800">Build Failed</div>
  </div>
);

const RunTime: FC<{ seconds: number }> = ({ seconds }) => (
  <div>
    <NumberShower number={seconds} precision={1} />s
  </div>
);

export const ModelCard: FC<Props> = ({ model, showOwner = true }) => {
  const { owner, slug, updatedAt, isPrivate, variables, currentRevision } =
    model;

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
  const {
    // buildStatus, lastBuild,
    squiggleSnippet,
  } = currentRevision;
  const body = squiggleSnippet?.code;

  const menuItems = (
    <InterspersedMenuItemsWithDots
      items={[
        totalImportCount && totalImportCount > 0 && (
          <VariablesDropdown
            key="variables-dropdown"
            variableRevisions={variableRevisions}
            relativeValuesExports={relativeValuesExports}
            owner={owner?.slug}
            slug={slug}
          >
            <EntityCardBadge
              presentAsLink={true}
            >{`${totalImportCount} variables`}</EntityCardBadge>
          </VariablesDropdown>
        ),
        isPrivate && <PrivateBadge key="private-badge" />,
        updatedAt && (
          <UpdatedStatus key="updated-status" time={updatedAt.getTime()} />
        ),
      ]}
    />
  );
  return (
    <div className="flex flex-col overflow-hidden">
      <div className="mb-1 px-2">
        {showOwner && <OwnerLink owner={owner} />}
        {showOwner && <span className="mx-1 text-gray-400">/</span>}
        <ModelLink owner={owner.slug} slug={slug} />
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-2 text-xs text-gray-500">
        {menuItems}
      </div>
      {body && (
        <div className="mt-3 overflow-hidden rounded-md bg-gray-100 px-2 py-2 text-xs">
          <div className="overflow-x-auto">
            <CodeSyntaxHighlighter language="squiggle" theme="github-light">
              {keepFirstNLines(body, 10)}
            </CodeSyntaxHighlighter>
          </div>
        </div>
      )}
    </div>
  );
};
