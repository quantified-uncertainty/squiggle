import { prisma } from "@/prisma";
import { builder } from "@/graphql/builder";

import { Me } from "../types/Me";

builder.mutationField("setUsername", (t) =>
  t.field({
    type: Me,
    authScopes: {
      user: true,
    },
    args: {
      username: t.arg.string({ required: true }),
    },
    errors: {},
    async resolve(_, args, { session }) {
      const email = session?.user.email;
      if (!email) {
        // shouldn't happen because we checked user auth scope previously, but helps with type checks
        throw new Error("Email is missing");
      }
      if (session.user.username) {
        throw new Error("Username is already set");
      }
      if (!args.username.match("^[a-zA-Z]\\w+$")) {
        throw new Error("Username must be alphanumerical");
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
