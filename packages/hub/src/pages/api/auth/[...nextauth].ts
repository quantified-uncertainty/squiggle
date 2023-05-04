import NextAuth, { AuthOptions } from "next-auth";

import { Provider } from "next-auth/providers";
import GithubProvider from "next-auth/providers/github";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import { prisma } from "@/prisma";

function buildAuthOptions() {
  const providers: Provider[] = [];

  if (process.env.SENDGRID_KEY && process.env.EMAIL_FROM) {
    providers.push(
      EmailProvider({
        server: `smtp://apikey:${process.env.SENDGRID_KEY}@smtp.sendgrid.net:587`,
        from: process.env.EMAIL_FROM,
      })
    );
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    providers.push(
      GithubProvider({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      })
    );
  }

  const authOptions: AuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers,
    callbacks: {
      session({ session, user }) {
        session.user.username = user.username;
        return session;
      },
    },
  };

  return authOptions;
}

export const authOptions = buildAuthOptions();

const handler = NextAuth(authOptions);

export default handler;
