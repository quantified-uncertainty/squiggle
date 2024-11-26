import "server-only";

import { FC, PropsWithChildren } from "react";

import { auth } from "@/auth";
import { isRootEmail, isSignedIn } from "@/graphql/helpers/userHelpers";
import { prisma } from "@/prisma";

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
    if (!(user.email && user.emailVerified && isRootEmail(user.email))) {
      return (
        <div className="grid flex-1 place-items-center">
          <div className="rounded-md bg-red-300 p-8">Unauthorized</div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
