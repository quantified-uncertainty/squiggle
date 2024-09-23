/*
 * Helper functions for server-side React components
 * TODO: unify these with `graphql/helpers/*`
 * (see https://github.com/quantified-uncertainty/squiggle/issues/3154, we plan to migrate away from GraphQL)
 */

import { getServerSession as getNextAuthServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { isSignedIn } from "@/graphql/helpers/userHelpers";

import { authOptions } from "../app/api/auth/[...nextauth]/authOptions";

export async function getServerSession() {
  return getNextAuthServerSession(authOptions);
}

export async function getUserOrRedirect() {
  const session = await getServerSession();
  if (!isSignedIn(session)) {
    redirect("/api/auth/signin"); // TODO - callbackUrl
  }

  return session.user;
}
