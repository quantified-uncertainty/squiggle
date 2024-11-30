import { FC } from "react";

import { EntityCard, UpdatedStatus } from "@/components/EntityCard";
import { GroupCardDTO } from "@/groups/data/groupCards";
import { groupRoute } from "@/lib/routes";

type Props = {
  group: GroupCardDTO;
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
