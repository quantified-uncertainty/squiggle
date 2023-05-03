import NextAuth from "next-auth";

import { Provider } from "next-auth/providers";
import GithubProvider from "next-auth/providers/github";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import { prisma } from "@/prisma";

function buildAuthHandler() {
  const providers: Provider[] = [];

  if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
    providers.push(
      EmailProvider({
        server: process.env.EMAIL_SERVER,
        from: process.env.EMAIL_FROM,
      })
    );
  }

  if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
    providers.push(
      GithubProvider({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET,
      })
    );
  }

  return NextAuth({
    adapter: PrismaAdapter(prisma),
    providers,
  });
}

const handler = buildAuthHandler();

export { handler as GET, handler as POST };
