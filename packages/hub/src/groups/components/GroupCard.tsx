import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { EntityCard, UpdatedStatus } from "@/components/EntityCard";
import { groupRoute } from "@/routes";

import { GroupCard$key } from "@/__generated__/GroupCard.graphql";

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
      href={groupRoute({
        slug: group.slug,
      })}
      showOwner={false}
      slug={group.slug}
      menuItems={
        <>
          <UpdatedStatus time={group.updatedAtTimestamp} />
        </>
      }
    />
  );
};
