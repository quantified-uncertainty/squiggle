import { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";
import { FC } from "react";
import { newDefinitionRoute, newGroupRoute } from "@/routes";
import Link from "next/link";
import { IconProps } from "@/relative-values/components/ui/icons/Icon";

import {
  Button,
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
  DropdownMenuHeader,
  ActionItemInternal,
  DropdownMenuSeparator,
  SignOutIcon,
  UserCircleIcon,
  ScaleIcon,
  GroupIcon,
} from "@quri/ui";

import { chooseUsernameRoute, userRoute } from "@/routes";
import { DropdownWithArrow } from "./DropdownWithArrow";
import { DropdownMenuNextLinkItem } from "@/components/ui/DropdownMenuNextLinkItem";
import {
  DISCORD_URL,
  GITHUB_DISCUSSION_URL,
  NEWSLETTER_URL,
} from "@/lib/common";

export const MenuLink: FC<{
  title: string;
  icon?: FC<IconProps>;
  href: string;
  external?: boolean;
  close: () => void;
}> = ({ title, icon, href, external, close }) => {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      onClick={() => close()}
    >
      <ActionItemInternal icon={icon} title={title} />
    </Link>
  );
};

export const UserControls: FC<{ session: Session | null }> = ({ session }) => {
  if (
    session?.user &&
    !session?.user.username &&
    !window.location.href.includes(chooseUsernameRoute())
  ) {
    // Next's redirect() is broken for components included from the root layout
    // https://github.com/vercel/next.js/issues/42556 (it's closed but not really solved)
    window.location.href = chooseUsernameRoute();
  }
  const { username } = session?.user || { username: undefined };

  return !!username ? (
    <div className="flex items-center gap-2">
      <Dropdown
        render={({ close }: { close: () => void }) => (
          <DropdownMenu>
            <DropdownMenuHeader>User Actions</DropdownMenuHeader>
            <DropdownMenuSeparator />
            <DropdownMenuNextLinkItem
              href={userRoute({ username: username! })}
              icon={UserCircleIcon}
              title="Profile"
              close={close}
            />
            <DropdownMenuActionItem
              onClick={() => {
                signOut();
                close();
              }}
              icon={SignOutIcon}
              title="Sign Out"
            />
            <DropdownMenuSeparator />
            <DropdownMenuHeader>Experimental</DropdownMenuHeader>
            <DropdownMenuSeparator />
            <DropdownMenuNextLinkItem
              href={newDefinitionRoute()}
              icon={ScaleIcon}
              title="New Relative Value Definition"
              close={close}
            />
            <DropdownMenuLinkItem
              href={newGroupRoute()}
              icon={GroupIcon}
              title="New Group"
              close={close}
            />
          </DropdownMenu>
        )}
      >
        <DropdownWithArrow text={username!} />
      </Dropdown>
    </div>
  ) : (
    <Button onClick={() => signIn()}>Sign In</Button>
  );
};
