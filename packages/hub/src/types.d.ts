import NextAuth, { DefaultSession } from "next-auth";

// https://next-auth.js.org/getting-started/typescript#extend-default-interface-properties
declare module "next-auth" {
  interface Session {
    user: {
      username?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser {
    username: string;
  }
}
