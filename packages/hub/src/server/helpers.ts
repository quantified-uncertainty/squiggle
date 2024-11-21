/*
 * Helper functions for server-side React components
 * TODO: unify these with `graphql/helpers/*`
 * (see https://github.com/quantified-uncertainty/squiggle/issues/3154, we plan to migrate away from GraphQL)
 */
import "server-only";

import { getServerSession as getNextAuthServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { isRootEmail, isSignedIn } from "@/graphql/helpers/userHelpers";
import { prisma } from "@/prisma";

import { authOptions } from "../app/api/auth/[...nextauth]/authOptions";

export async function getServerSession() {
  return getNextAuthServerSession(authOptions);
}

export async function getSessionUserOrRedirect() {
  const session = await getServerSession();
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
