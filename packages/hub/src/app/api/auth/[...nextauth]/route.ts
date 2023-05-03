import NextAuth from "next-auth";

import { Provider } from "next-auth/providers";
import GithubProvider from "next-auth/providers/github";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import { prisma } from "@/prisma";

function buildAuthOptions() {
  const providers: Provider[] = [];

  if (process.env.SENDGRID_API && process.env.EMAIL_FROM) {
    providers.push(
      {
        id: "sendgrid",
        type: "email",
        name: "Email",
        server: "https://api.sendgrid.com/v3/mail/send",
        options: {},
        async sendVerificationRequest({ identifier: email, url }) {
          // Call the cloud Email provider API for sending emails
          // See https://docs.sendgrid.com/api-reference/mail-send/mail-send
          const host = new URL(url).host;

          const response = await fetch(
            "https://api.sendgrid.com/v3/mail/send",
            {
              // The body format will vary depending on provider, please see their documentation
              // for further details.
              body: JSON.stringify({
                personalizations: [{ to: [{ email }] }],
                from: { email: process.env.EMAIL_FROM },
                subject: `Sign in to ${host}`,
                content: [
                  {
                    type: "text/plain",
                    value: `Please click here to authenticate - ${url}`,
                  },
                ],
              }),
              headers: {
                // Authentication will also vary from provider to provider, please see their docs.
                Authorization: `Bearer ${process.env.SENDGRID_API}`,
                "Content-Type": "application/json",
              },
              method: "POST",
            }
          );

          if (!response.ok) {
            const { errors } = await response.json();
            throw new Error(JSON.stringify(errors));
          }
        },
      }
      // EmailProvider({
      //   server: process.env.EMAIL_SERVER,
      //   from: process.env.EMAIL_FROM,
      // })
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

  return {
    adapter: PrismaAdapter(prisma),
    providers,
  };
}

export const authOptions = buildAuthOptions();

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
