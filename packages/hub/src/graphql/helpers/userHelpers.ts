import { User } from "@prisma/client";
import { Session } from "next-auth";

import { prisma } from "@/prisma";

import { SignedInSession } from "../builder";

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
  // see also: `isRootUser` auth scope in builder.ts
  return Boolean(user.email && user.emailVerified && isRootEmail(user.email));
}
