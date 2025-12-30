import { redirect } from "next/navigation";
import { FC, PropsWithChildren } from "react";

import { auth } from "@/lib/server/auth";
import { chooseUsernameRoute } from "@/lib/routes";
import { prisma } from "@/lib/server/prisma";
import { isAdminUser, isSignedIn } from "@/users/auth";

import { RedirectToLogin } from "./RedirectToLogin";

type Props = PropsWithChildren<{
  rootOnly?: boolean;
}>;

export const WithAuth: FC<Props> = async ({ children, rootOnly = false }) => {
  const session = await auth();

  // User is authenticated but hasn't chosen a username yet
  if (session?.user?.email && !session?.user?.username) {
    redirect(chooseUsernameRoute());
  }

  if (!isSignedIn(session)) {
    return <RedirectToLogin />;
  }

  if (rootOnly) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user.email },
    });
    if (!isAdminUser(user)) {
      return (
        <div className="grid flex-1 place-items-center">
          <div className="rounded-md bg-red-300 p-8">Unauthorized</div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
