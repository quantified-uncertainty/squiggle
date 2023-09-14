import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { CodeBracketIcon, ScaleIcon } from "@quri/ui";

import { ModelCard$key } from "@/__generated__/ModelCard.graphql";
import { EntityCard } from "@/components/EntityCard";
import { StyledLink } from "@/components/ui/StyledLink";
import { modelForRelativeValuesExportRoute, modelRoute } from "@/routes";

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
  const exports = model.currentRevision.relativeValuesExports;

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
        <div className="mt-2">
          {model.currentRevision.relativeValuesExports.map((e, i) => (
            <StyledLink
              key={i}
              href={modelForRelativeValuesExportRoute({
                owner: model.owner.slug,
                slug: model.slug,
                variableName: e.variableName,
              })}
              className="items-center flex font-mono text-xs"
            >
              <ScaleIcon size={14} className="opacity-60" />
              <span className="ml-1">{`${e.variableName}:${e.definition.slug}`}</span>
            </StyledLink>
          ))}
        </div>
      )}
    </EntityCard>
  );
};
