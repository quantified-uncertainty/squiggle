import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { ModelCard$key } from "@/__generated__/ModelCard.graphql";
import { StyledLink } from "@/components/ui/StyledLink";
import { modelRoute, modelForRelativeValuesExportRoute } from "@/routes";
import { CodeBracketIcon, LinkIcon, ScaleIcon } from "@quri/ui";
import { EntityCard } from "@/components/EntityCard";

const Fragment = graphql`
  fragment ModelCard on Model {
    slug
    updatedAtTimestamp
    owner {
      username
      ...UserLinkFragment
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

  return (
    <EntityCard
      icon={CodeBracketIcon}
      updatedAtTimestamp={model.updatedAtTimestamp}
      href={modelRoute({
        username: model.owner.username,
        slug: model.slug,
      })}
      showOwner={showOwner}
      isPrivate={model.isPrivate}
      ownerName={model.owner.username}
      slug={model.slug}
    >
      {exports.length > 0 && (
        <div className="mt-2">
          {model.currentRevision.relativeValuesExports.map((e, i) => (
            <StyledLink
              key={i}
              href={modelForRelativeValuesExportRoute({
                username: model.owner.username,
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
