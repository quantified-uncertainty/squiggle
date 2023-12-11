import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { AuthOptions } from "next-auth";
import { Provider } from "next-auth/providers";
import EmailProvider from "next-auth/providers/email";
import GithubProvider from "next-auth/providers/github";

import { prisma } from "@/prisma";
import { indexUserId } from "@/graphql/helpers/searchHelpers";

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
        await indexUserId(user.id);
      },
    },
  };

  return authOptions;
}

export const authOptions = buildAuthOptions();
