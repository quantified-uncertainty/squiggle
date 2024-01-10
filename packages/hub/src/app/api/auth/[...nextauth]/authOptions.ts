import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { AuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import GithubProvider from "next-auth/providers/github";
import { Provider } from "next-auth/providers/index";

import { indexUserId } from "@/graphql/helpers/searchHelpers";
import { prisma } from "@/prisma";

function buildAuthOptions() {
  const providers: Provider[] = [];

  const { SENDGRID_KEY, EMAIL_FROM } = process.env;

  if (SENDGRID_KEY && EMAIL_FROM) {
    providers.push(
      EmailProvider({
        server: `smtp://apikey:${SENDGRID_KEY}@smtp.sendgrid.net:587`,
        from: EMAIL_FROM,
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
