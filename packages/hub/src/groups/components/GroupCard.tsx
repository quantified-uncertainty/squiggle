import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { GroupIcon } from "@quri/ui";

import { GroupCard$key } from "@/__generated__/GroupCard.graphql";
import { EntityCard } from "@/components/EntityCard";
import { groupRoute } from "@/routes";

const Fragment = graphql`
  fragment GroupCard on Group {
    id
    slug
    updatedAtTimestamp
  }
`;

type Props = {
  groupRef: GroupCard$key;
};

export const GroupCard: FC<Props> = ({ groupRef }) => {
  const group = useFragment(Fragment, groupRef);

  return (
    <EntityCard
      icon={GroupIcon}
      updatedAtTimestamp={group.updatedAtTimestamp}
      href={groupRoute({
        slug: group.slug,
      })}
      showOwner={false}
      slug={group.slug}
    />
  );
};
