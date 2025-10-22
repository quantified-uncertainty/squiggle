import "server-only";

import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { NextAuthConfig, NextAuthResult, Session } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { Provider } from "next-auth/providers/index";
import Resend from "next-auth/providers/resend";
import { cache } from "react";

import { prisma } from "@/lib/server/prisma";
import { indexUserId } from "@/search/helpers";

import { CLI_MODE } from "../constants";
import { getCliUserEmail } from "./cli";

function buildAuthConfig(): NextAuthConfig {
  const providers: Provider[] = [];

  const { AUTH_RESEND_KEY, EMAIL_FROM } = process.env;

  if (AUTH_RESEND_KEY && EMAIL_FROM) {
    providers.push(
      Resend({
        apiKey: AUTH_RESEND_KEY,
        from: EMAIL_FROM,
        name: "Email",
      })
    );
  }

  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = process.env;
  if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
    providers.push(
      GithubProvider({
        clientId: GITHUB_CLIENT_ID,
        clientSecret: GITHUB_CLIENT_SECRET,
      })
    );
  }

  // Dev-only: print login link to console
  if (
    process.env.NODE_ENV === "development" &&
    process.env["DEV_AUTH_ENABLED"] === "true"
  ) {
    providers.push(
      Resend({
        apiKey: "dummy-key-not-used",
        from: "dev@localhost",
        name: "Dev Email (Check Console)",
        async sendVerificationRequest({ identifier: email, url }) {
          console.log("\n===========================================");
          console.log("🔐 DEV LOGIN LINK");
          console.log(`Email: ${email}`);
          console.log(`\nClick here to sign in:\n${url}\n`);
          console.log("===========================================\n");
        },
      })
    );
  }

  const config: NextAuthConfig = {
    adapter: PrismaAdapter(
      prisma as any // @auth/prisma-adapter doesn't support our PrismaClient from @quri/hub-db
    ),
    providers,
    callbacks: {
      async session({ session, user }) {
        // is there a way to ask PrismaAdapter to select it by default?
        const fullUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: { asOwner: true },
        });
        const username = fullUser?.asOwner?.slug;
        if (username) {
          session.user.username = username;
        }
        return session;
      },
    },
    events: {
      async createUser({ user }) {
        if (user.id) {
          await indexUserId(user.id);
        }
      },
    },
  };

  return config;
}

function makeAuth(): NextAuthResult {
  const makeCliMock = (name: string) => () => {
    throw new Error(`${name} is not supported in CLI mode`);
  };

  if (CLI_MODE) {
    // This code doesn't guarantee that CLI scripts will always work, but in basic cases it has a decent chance.
    // See also: `docs/cli.md` file.
    return {
      auth: (async (): Promise<Session | null> => {
        const cliUserEmail = getCliUserEmail();
        if (!cliUserEmail) {
          return null;
        }
        const user = await prisma.user.findUnique({
          where: {
            email: cliUserEmail,
          },
          select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            image: true,
            asOwner: {
              select: {
                slug: true,
              },
            },
          },
        });
        return {
          user: {
            ...user,
            username: user?.asOwner?.slug,
          },
          expires: new Date(Date.now() + 86400 * 1000 * 365).toISOString(),
        } satisfies Session;
      }) as any,
      signIn: makeCliMock("signIn"),
      signOut: makeCliMock("signOut"),
      handlers: {
        GET: makeCliMock("GET"),
        POST: makeCliMock("POST"),
      },
      unstable_update: makeCliMock("unstable_update"),
    };
  }
  return NextAuth(buildAuthConfig());
}

const nextAuth = makeAuth();
export const { handlers, signIn, signOut } = nextAuth;

// current next-auth v5 beta doesn't cache the session, unsure if intentionally
// note: this is React builtin cache, so it's per-request
export const auth = cache(nextAuth.auth);
