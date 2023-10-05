import { useSession } from "next-auth/react";

import { chooseUsernameRoute } from "@/routes";

export function useForceChooseUsername() {
  const { data: session } = useSession();

  if (
    session?.user &&
    !session?.user.username &&
    !window.location.href.includes(chooseUsernameRoute())
  ) {
    // Next's redirect() is broken for components included from the root layout
    // https://github.com/vercel/next.js/issues/42556 (it's closed but not really solved)
    window.location.href = chooseUsernameRoute();
  }
}
