import { FC, PropsWithChildren } from "react";

import { auth } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { isRootUser, isSignedIn } from "@/users/auth";

import { RedirectToLogin } from "./RedirectToLogin";

type Props = PropsWithChildren<{
  rootOnly?: boolean;
}>;

export const WithAuth: FC<Props> = async ({ children, rootOnly = false }) => {
  const session = await auth();
  if (!isSignedIn(session)) {
    return <RedirectToLogin />;
  }

  if (rootOnly) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user.email },
    });
    if (!isRootUser(user)) {
      return (
        <div className="grid flex-1 place-items-center">
          <div className="rounded-md bg-red-300 p-8">Unauthorized</div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
