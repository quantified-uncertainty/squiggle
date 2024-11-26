import { Session } from "next-auth";
import { usePathname, useRouter } from "next/navigation";

import { chooseUsernameRoute } from "@/routes";

export function useForceChooseUsername(session: Session | null) {
  const pathname = usePathname();
  const router = useRouter();

  if (
    session?.user &&
    !session?.user.username &&
    !pathname.includes(chooseUsernameRoute())
  ) {
    router.push(chooseUsernameRoute());
  }
}
