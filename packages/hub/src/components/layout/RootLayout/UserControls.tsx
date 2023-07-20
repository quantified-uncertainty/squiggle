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
import { DropdownMenuLinkItem } from "@/components/ui/DropdownMenuLinkItem";

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
            <DropdownMenuLinkItem
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
            <DropdownMenuLinkItem
              href={"/discord"}
              icon={UserCircleIcon}
              title="Discord"
              close={close}
            />
            <DropdownMenuLinkItem
              href={"https://github.com/quantified-uncertainty/squiggle"}
              icon={UserCircleIcon}
              title="Github"
              close={close}
            />
            <DropdownMenuLinkItem
              href={
                "https://github.com/quantified-uncertainty/squiggle/discussions"
              }
              icon={UserCircleIcon}
              title="Issues"
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
