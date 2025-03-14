import { Session } from "next-auth";
import { redirect } from "next/navigation";

import { User } from "@quri/hub-db";

import { CLI_MODE } from "@/lib/constants";
import { auth } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

export async function getSessionOrRedirect() {
  const session = await auth();
  if (!isSignedIn(session)) {
    if (CLI_MODE) {
      throw new Error("Unauthorized");
    }
    redirect("/api/auth/signin"); // TODO - callbackUrl
  }

  return session;
}

export async function getSessionUserOrRedirect() {
  return (await getSessionOrRedirect()).user;
}

// Checks if the user is a root user. If so, returns the user.
export async function checkRootUser() {
  const sessionUser = await getSessionUserOrRedirect();
  if (!isAdminUser(sessionUser)) {
    throw new Error("Unauthorized");
  }

  // TODO - is this necessary? we usually don't need to load the user from the database.
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: sessionUser.email },
  });
  return user as User & { email: NonNullable<User["email"]> };
}

export type SignedInSession = Session & {
  user: NonNullable<Session["user"]> & {
    email: NonNullable<Session["user"]["email"]>;
    username: NonNullable<Session["user"]["username"]>;
  };
};

export function isSignedIn(
  session: Session | null
): session is SignedInSession {
  // Note: username is not set initially, when the user first signs in.
  // `useForceChooseUsername` hook will redirect the user to the choose username page if necessary.
  // The server components and server actions involved in that shouldn't rely on this function to check if the user is signed in.
  return Boolean(session?.user.email && session.user.username);
}

export async function getSelf(session: SignedInSession) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: session.user.email },
  });
  return user;
}

// Env var is called "ROOT_EMAILS" for historical reasons.
// All other APIs are called "admin" to avoid the confusion because we also use the word "root" in another sense, in React components.
// (e.g. `RootLayout`, `ReactRoot`).
const ADMIN_EMAILS = (process.env["ROOT_EMAILS"] ?? "").split(",");

export function isAdminUser(user: NonNullable<Session["user"]>) {
  return Boolean(user.email && ADMIN_EMAILS.includes(user.email));
}
