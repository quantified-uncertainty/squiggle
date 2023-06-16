import { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserCircleIcon, SignOutIcon } from "@quri/ui";

import {
  Button,
  DropdownMenu,
  Dropdown,
  DropdownMenuActionItem,
  DropdownMenuHeader,
  DropdownMenuSeparator,
} from "@quri/ui";

import { chooseUsernameRoute } from "@/routes";
import { userRoute } from "@/routes";
import { DropdownWithArrow } from "./TopMenuComponents";

export function UserControls({ session }: { session: Session | null }) {
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

  return !username ? (
    <Button onClick={() => signIn()}>Sign In</Button>
  ) : (
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
  );
}
