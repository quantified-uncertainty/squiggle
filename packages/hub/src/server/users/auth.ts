import "server-only";

import { User } from "@prisma/client";
import { Session } from "next-auth";
import { redirect } from "next/navigation";

import { prisma } from "@/prisma";

import { auth } from "../../auth";

export async function getSessionOrRedirect() {
  const session = await auth();
  if (!isSignedIn(session)) {
    redirect("/api/auth/signin"); // TODO - callbackUrl
  }

  return session;
}

export async function getSessionUserOrRedirect() {
  return (await getSessionOrRedirect()).user;
}

export async function checkRootUser() {
  const sessionUser = await getSessionUserOrRedirect();
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: sessionUser.email },
  });
  if (!(user.email && user.emailVerified && isRootEmail(user.email))) {
    throw new Error("Unauthorized");
  }
}

export type SignedInSession = Session & {
  user: NonNullable<Session["user"]> & { email: string };
};

export function isSignedIn(
  session: Session | null
): session is SignedInSession {
  return Boolean(session?.user.email);
}

export async function getSelf(session: SignedInSession) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: session.user.email },
  });
  return user;
}

const ROOT_EMAILS = (process.env["ROOT_EMAILS"] ?? "").split(",");

export function isRootEmail(email: string) {
  return ROOT_EMAILS.includes(email);
}

export async function isRootUser(user: User) {
  return Boolean(user.email && user.emailVerified && isRootEmail(user.email));
}
