import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { relativeValuesRoute } from "@/routes";
import { RelativeValuesDefinitionCard$key } from "@/__generated__/RelativeValuesDefinitionCard.graphql";
import { ScaleIcon } from "@quri/ui";
import { EntityCard } from "@/components/EntityCard";

const Fragment = graphql`
  fragment RelativeValuesDefinitionCard on RelativeValuesDefinition {
    slug
    updatedAtTimestamp
    owner {
      username
      ...UserLinkFragment
    }
  }
`;

type Props = {
  definitionRef: RelativeValuesDefinitionCard$key;
  showOwner?: boolean;
};

export const RelativeValuesDefinitionCard: FC<Props> = ({
  definitionRef,
  showOwner = true,
}) => {
  const definition = useFragment(Fragment, definitionRef);

  return (
    <EntityCard
      icon={ScaleIcon}
      updatedAtTimestamp={definition.updatedAtTimestamp}
      href={relativeValuesRoute({
        username: definition.owner.username,
        slug: definition.slug,
      })}
      showOwner={showOwner}
      ownerName={definition.owner.username}
      slug={definition.slug}
    ></EntityCard>
  );
};
