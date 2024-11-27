import { FC } from "react";

import { EntityCard, UpdatedStatus } from "@/components/EntityCard";
import { groupRoute } from "@/routes";
import { GroupCardData } from "@/server/groups/data";

type Props = {
  group: GroupCardData;
};

export const GroupCard: FC<Props> = ({ group }) => {
  return (
    <EntityCard
      href={groupRoute({
        slug: group.slug,
      })}
      showOwner={false}
      slug={group.slug}
      menuItems={<UpdatedStatus time={group.updatedAt.getTime()} />}
    />
  );
};
