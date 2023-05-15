import { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";

import { Button } from "@quri/ui";

import { chooseUsernameRoute } from "@/routes";
import { UsernameLink } from "../UsernameLink";

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

  return !session?.user ? (
    <Button onClick={() => signIn()}>Sign In</Button>
  ) : (
    <div className="flex items-center gap-2">
      {session.user.username === undefined ? null : (
        <div>
          <UsernameLink username={session.user.username} />
        </div>
      )}
      <Button onClick={() => signOut()}>Sign Out</Button>
    </div>
  );
}
