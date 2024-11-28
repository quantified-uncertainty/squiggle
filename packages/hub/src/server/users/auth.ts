/*
 * Helper functions for server-side React components
 * TODO: unify these with `graphql/helpers/*`
 * (see https://github.com/quantified-uncertainty/squiggle/issues/3154, we plan to migrate away from GraphQL)
 */
import "server-only";

import { redirect } from "next/navigation";

import { isRootEmail, isSignedIn } from "@/graphql/helpers/userHelpers";
import { prisma } from "@/prisma";

import { auth } from "../../auth";

export async function getSessionUserOrRedirect() {
  const session = await auth();
  if (!isSignedIn(session)) {
    redirect("/api/auth/signin"); // TODO - callbackUrl
  }

  return session.user;
}

export async function checkRootUser() {
  // TODO - unify with src/graphql/helpers
  const sessionUser = await getSessionUserOrRedirect();
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: sessionUser.email },
  });
  if (!(user.email && user.emailVerified && isRootEmail(user.email))) {
    throw new Error("Unauthorized");
  }
}
