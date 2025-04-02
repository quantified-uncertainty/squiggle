"use client";
import { usePathname } from "next/navigation";
import { FC } from "react";

import { GroupIcon } from "@quri/ui";

import {
  PageManuDesktopHeader,
  PageMenu,
  PageMenuLink,
} from "@/components/ui/PageMenu";
import { GroupCardDTO } from "@/groups/data/groupCards";
import { groupMembersRoute, groupRoute } from "@/lib/routes";

const MobileGroupNavHeaderText: FC<{ slug: string }> = ({ slug }) => {
  const pathname = usePathname();

  switch (pathname) {
    case groupRoute({ slug }):
      return "Models in " + slug;
    case groupMembersRoute({ slug }):
      return "Members of " + slug;
    default:
      return null;
  }
};

const MobileGroupNavHeader: FC<{ slug: string }> = ({ slug }) => {
  return (
    <div className="truncate text-ellipsis whitespace-nowrap text-sm font-medium text-slate-600">
      <MobileGroupNavHeaderText slug={slug} />
    </div>
  );
};

export const GroupNav: FC<{ group: GroupCardDTO }> = ({ group }) => {
  return (
    <PageMenu
      mobileHeader={<MobileGroupNavHeader slug={group.slug} />}
      desktopHeader={
        <PageManuDesktopHeader icon={GroupIcon} title={group.slug} />
      }
    >
      <PageMenuLink name="Models" href={groupRoute({ slug: group.slug })} />
      <PageMenuLink
        name="Members"
        href={groupMembersRoute({ slug: group.slug })}
      />
    </PageMenu>
  );
};
