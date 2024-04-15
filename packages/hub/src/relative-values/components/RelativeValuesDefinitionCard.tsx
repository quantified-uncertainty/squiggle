import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { EntityCard, UpdatedStatus } from "@/components/EntityCard";
import { relativeValuesRoute } from "@/routes";

import { RelativeValuesDefinitionCard$key } from "@/__generated__/RelativeValuesDefinitionCard.graphql";

const Fragment = graphql`
  fragment RelativeValuesDefinitionCard on RelativeValuesDefinition {
    slug
    updatedAtTimestamp
    owner {
      slug
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
      href={relativeValuesRoute({
        owner: definition.owner.slug,
        slug: definition.slug,
      })}
      showOwner={showOwner}
      ownerName={definition.owner.slug}
      slug={definition.slug}
      menuItems={
        <>
          <UpdatedStatus time={definition.updatedAtTimestamp} />
        </>
      }
    />
  );
};
