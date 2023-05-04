import { prisma } from "@/prisma";
import { builder } from "../builder";
import { getSession } from "next-auth/react";

const Me = builder.simpleObject("Me", {
  fields: (t) => ({
    email: t.string({ nullable: true }), // TODO - guarantee in NextAuth configuration? check and throw?
    username: t.string({ nullable: true }),
  }),
});

builder.queryField("me", (t) =>
  t.field({
    type: Me,
    authScopes: {
      user: true,
    },
    async resolve(_, __, { session }) {
      if (!session) {
        throw new Error("Impossible, should be guaranteed by authScopes");
      }
      return session.user;
    },
  })
);

builder.mutationField("setUsername", (t) =>
  t.field({
    type: Me,
    authScopes: {
      user: true,
    },
    args: {
      username: t.arg.string({ required: true }),
    },
    async resolve(_, args, { session }) {
      const email = session?.user.email;
      if (!email) {
        throw new Error("Email is missing");
      }
      if (session.user.username) {
        throw new Error("Username is already set");
      }

      await prisma.user.update({
        where: {
          email,
        },
        data: {
          username: args.username,
        },
      });

      // I tried to call getSession() here to get a fresh session, but it didn't work;
      // I suspect the reason is Next.js fetch() cache.
      return {
        ...session.user,
        username: args.username,
      };
    },
  })
);
