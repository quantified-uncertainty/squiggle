import { Session } from "next-auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { chooseUsernameRoute } from "@/routes";

export function useForceChooseUsername(session: Session | null) {
  const pathname = usePathname();
  const router = useRouter();

  const shouldChoose = session?.user && !session.user.username;
  const shouldRedirect =
    shouldChoose && !pathname.includes(chooseUsernameRoute());

  useEffect(() => {
    if (shouldRedirect) {
      router.push(chooseUsernameRoute());
    }
  }, [shouldRedirect]);

  return { shouldRedirect, shouldChoose };
}
