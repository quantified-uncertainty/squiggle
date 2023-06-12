import { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { TriangleIcon, UserCircleIcon, SignOutIcon } from "@quri/ui";

import {
  Button,
  DropdownMenu,
  Dropdown,
  DropdownMenuActionItem,
} from "@quri/ui";

import { chooseUsernameRoute } from "@/routes";
import { userRoute } from "@/routes";

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

  return !session?.user ? (
    <Button onClick={() => signIn()}>Sign In</Button>
  ) : (
    <div className="flex items-center gap-2">
      <Dropdown
        render={() => (
          <DropdownMenu>
            {!!session.user.username && (
              <DropdownMenuActionItem
                onClick={() =>
                  router.push(
                    userRoute({ username: session.user.username || "" })
                  )
                }
                icon={UserCircleIcon}
                title="Profile"
              />
            )}
            <DropdownMenuActionItem
              onClick={() => signOut()}
              icon={SignOutIcon}
              title="Sign Out"
            />
          </DropdownMenu>
        )}
      >
        <div className="flex items-center text-white cursor-pointer hover:bg-slate-700 px-2 py-1 rounded-md select-none text-sm">
          {session.user.username}
          <TriangleIcon size={6} className={"rotate-180 ml-2 text-slate-300"} />
        </div>
      </Dropdown>
    </div>
  );
}
