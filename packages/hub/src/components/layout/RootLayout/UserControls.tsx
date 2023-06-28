import { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FC } from "react";

import {
  Button,
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
  DropdownMenuHeader,
  DropdownMenuSeparator,
  SignOutIcon,
  UserCircleIcon,
} from "@quri/ui";

import { chooseUsernameRoute, userRoute } from "@/routes";
import { DropdownWithArrow } from "./DropdownWithArrow";

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
  const router = useRouter();
  const { username } = session?.user || { username: undefined };

  return !!username ? (
    <div className="flex items-center gap-2">
      <Dropdown
        render={() => (
          <DropdownMenu>
            <DropdownMenuHeader>User Actions</DropdownMenuHeader>
            <DropdownMenuSeparator />
            <DropdownMenuActionItem
              onClick={() => router.push(userRoute({ username: username! }))}
              icon={UserCircleIcon}
              title="Profile"
            />
            <DropdownMenuActionItem
              onClick={() => signOut()}
              icon={SignOutIcon}
              title="Sign Out"
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
