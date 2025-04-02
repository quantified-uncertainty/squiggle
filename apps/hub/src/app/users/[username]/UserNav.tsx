"use client";
import { usePathname } from "next/navigation";
import { FC } from "react";

import { UserCircleIcon } from "@quri/ui";

import { PageMenu, PageMenuLink } from "@/components/ui/PageMenu";
import {
  userDefinitionsRoute,
  userGroupsRoute,
  userRoute,
  userVariablesRoute,
} from "@/lib/routes";
import { UserLayoutDTO } from "@/users/data/layoutUser";

const MobileNavHeaderText: FC<{ username: string }> = ({ username }) => {
  const pathname = usePathname();

  switch (pathname) {
    case userRoute({ username }):
      return "Models by " + username;
    case userVariablesRoute({ username }):
      return "Variables by " + username;
    case userDefinitionsRoute({ username }):
      return "Definitions by " + username;
    case userGroupsRoute({ username }):
      return "Groups by " + username;
    default:
      return null;
  }
};

const MobileNavHeader: FC<{ username: string }> = ({ username }) => {
  return (
    <div className="truncate text-ellipsis whitespace-nowrap text-sm font-medium text-slate-600">
      <MobileNavHeaderText username={username} />
    </div>
  );
};

// Based on EntityInfo styles
const DesktopNavHeader: FC<{ user: UserLayoutDTO }> = ({ user }) => {
  return (
    <div className="mb-2 flex items-center border-b border-slate-200 px-2 pb-4">
      <UserCircleIcon className="mr-2 text-gray-700 opacity-50" size={18} />
      <div className="overflow-hidden text-ellipsis whitespace-nowrap text-gray-600">
        {user.username}
      </div>
    </div>
  );
};

export const UserNav: FC<{ user: UserLayoutDTO; isMe: boolean }> = ({
  user,
  isMe,
}) => {
  return (
    <PageMenu
      mobileHeader={<MobileNavHeader username={user.username} />}
      desktopHeader={<DesktopNavHeader user={user} />}
    >
      {isMe || user.hasModels ? (
        <PageMenuLink
          name="Models"
          href={userRoute({ username: user.username })}
        />
      ) : null}
      {isMe || user.hasVariables ? (
        <PageMenuLink
          name="Variables"
          href={userVariablesRoute({ username: user.username })}
        />
      ) : null}
      {isMe || user.hasDefinitions ? (
        <PageMenuLink
          name="Definitions"
          href={userDefinitionsRoute({ username: user.username })}
        />
      ) : null}
      {isMe || user.hasGroups ? (
        <PageMenuLink
          name="Groups"
          href={userGroupsRoute({ username: user.username })}
        />
      ) : null}
    </PageMenu>
  );
};
