import "server-only";

import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { NextAuthConfig } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { Provider } from "next-auth/providers/index";
import Resend from "next-auth/providers/resend";
import { cache } from "react";

import { prisma } from "@/lib/server/prisma";
import { indexUserId } from "@/search/helpers";

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

  const config: NextAuthConfig = {
    adapter: PrismaAdapter(prisma),
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

const nextAuth = NextAuth(buildAuthConfig());
export const { handlers, signIn, signOut } = nextAuth;

// current next-auth v5 beta doesn't cache the session, unsure if intentionally
// note: this is React builtin cache, so it's per-request
export const auth = cache(nextAuth.auth);
