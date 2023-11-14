import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import {
  CodeBracketIcon,
  Dropdown,
  DropdownMenu,
  ScaleIcon,
  ShareIcon,
} from "@quri/ui";

import { ModelCard$key } from "@/__generated__/ModelCard.graphql";
import { EntityCard } from "@/components/EntityCard";
import { StyledLink } from "@/components/ui/StyledLink";
import {
  modelExportRoute,
  modelForRelativeValuesExportRoute,
  modelRoute,
} from "@/routes";
import { DropdownMenuNextLinkItem } from "@/components/ui/DropdownMenuNextLinkItem";
import { ExportsDropdown } from "@/lib/ExportsDropdown";

const Fragment = graphql`
  fragment ModelCard on Model {
    id
    slug
    updatedAtTimestamp
    owner {
      slug
    }
    isPrivate
    currentRevision {
      exports {
        variableName
        title
      }
      relativeValuesExports {
        variableName
        definition {
          slug
        }
      }
    }
  }
`;

type Props = {
  modelRef: ModelCard$key;
  showOwner?: boolean;
};

export const ModelCard: FC<Props> = ({ modelRef, showOwner = true }) => {
  const model = useFragment(Fragment, modelRef);
  const rvExports = model.currentRevision.relativeValuesExports;
  const exports = model.currentRevision.exports;

  const modelUrl = modelRoute({
    owner: model.owner.slug,
    slug: model.slug,
  });

  return (
    <EntityCard
      icon={CodeBracketIcon}
      updatedAtTimestamp={model.updatedAtTimestamp}
      href={modelUrl}
      showOwner={showOwner}
      isPrivate={model.isPrivate}
      ownerName={model.owner.slug}
      slug={model.slug}
    >
      {exports.length > 0 && (
        <ExportsDropdown
          modelExports={exports.map(({ variableName, title }) => ({
            variableName,
            title: title || variableName,
          }))}
          relativeValuesExports={rvExports.map(
            ({ variableName, definition: { slug } }) => ({ variableName, slug })
          )}
          owner={model.owner.slug}
          slug={model.slug}
        >
          <div className="flex group">
            <div className="cursor-pointer items-center flex group-hover:bg-slate-200 rounded-md px-1 py-0.5 mt-1 text-sm">
              <span className="mr-1.5 text-xs text-slate-800 bg-slate-200 group-hover:bg-slate-300 px-1.5 py-0.5 text-center rounded-full">
                {exports.length}
              </span>
              Exports
            </div>
          </div>
        </ExportsDropdown>
      )}
    </EntityCard>
  );
};
