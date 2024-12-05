import { FC } from "react";

import { DropdownMenuHeader, GroupIcon, PlusIcon } from "@quri/ui";

import { DropdownMenuNextLinkItem } from "@/components/ui/DropdownMenuNextLinkItem";
import { GroupCardDTO } from "@/groups/data/groupCards";
import { groupRoute, newGroupRoute } from "@/lib/routes";
import { Paginated } from "@/lib/types";

type Props = {
  groups: Paginated<GroupCardDTO>;
  close: () => void;
};

export const MyGroupsMenu: FC<Props> = ({ groups, close }) => {
  return (
    <>
      <DropdownMenuHeader>My Groups</DropdownMenuHeader>

      {groups.items.length ? (
        <>
          {groups.items.map((group) => (
            <DropdownMenuNextLinkItem
              key={group.id}
              href={groupRoute({ slug: group.slug })}
              icon={GroupIcon}
              title={group.slug}
              close={close}
            />
          ))}
        </>
      ) : null}
      <DropdownMenuNextLinkItem
        href={newGroupRoute()}
        icon={PlusIcon}
        title="New Group"
        close={close}
      />
      {/* TODO: "...show all" link is loadNext is true */}
    </>
  );
};
