"use client";
import { FC, useCallback } from "react";

import { DropdownMenu } from "@quri/ui";

import { LoadMore } from "@/components/LoadMore";
import { DotsDropdown } from "@/components/ui/DotsDropdown";
import { H2 } from "@/components/ui/Headers";
import { GroupMemberDTO } from "@/groups/data/members";
import { usePaginator } from "@/lib/hooks/usePaginator";
import { Paginated } from "@/lib/types";

import { AddUserToGroupAction } from "./AddUserToGroupAction";
import { GroupMemberCard } from "./GroupMemberCard";

type Props = {
  groupSlug: string;
  page: Paginated<GroupMemberDTO>;
  isAdmin: boolean;
};

export const GroupMemberList: FC<Props> = ({
  groupSlug,
  page: initialPage,
  isAdmin,
}) => {
  const page = usePaginator(initialPage);

  const updateMembership = useCallback(
    (membership: GroupMemberDTO) => {
      page.update((item) => (item.id === membership.id ? membership : item));
    },
    [page]
  );

  const removeMembership = useCallback(
    (membership: GroupMemberDTO) => {
      page.remove((item) => item.id === membership.id);
    },
    [page]
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <H2>Members</H2>
        {isAdmin && (
          <DotsDropdown>
            {() => (
              <DropdownMenu>
                <AddUserToGroupAction
                  groupSlug={groupSlug}
                  append={page.append}
                />
              </DropdownMenu>
            )}
          </DotsDropdown>
        )}
      </div>
      <div className="mt-2 space-y-2">
        {page.items.map((membership) => (
          <GroupMemberCard
            key={membership.id}
            groupSlug={groupSlug}
            isAdmin={isAdmin}
            membership={membership}
            remove={removeMembership}
            update={updateMembership}
          />
        ))}
      </div>
      {page.loadNext && <LoadMore loadNext={page.loadNext} />}
    </div>
  );
};
