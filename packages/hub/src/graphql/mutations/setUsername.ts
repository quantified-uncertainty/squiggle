import { prisma } from "@/prisma";
import { builder } from "@/graphql/builder";

import { Me } from "../types/Me";
import { validateSlug } from "../utils";
import { ZodError } from "zod";

builder.mutationField("setUsername", (t) =>
  t.withAuth({ signedIn: true }).field({
    type: Me,
    args: {
      username: t.arg.string({ required: true, validate: validateSlug }),
    },
    errors: { types: [ZodError] },
    async resolve(_, args, { session }) {
      if (session.user.username) {
        throw new Error("Username is already set");
      }

      const existingOwner = await prisma.owner.count({
        where: { slug: args.username },
      });
      if (existingOwner) {
        throw new Error(`Username ${args.username} is not available`);
      }

      await prisma.user.update({
        where: {
          email: session.user.email,
        },
        data: {
          asOwner: {
            create: { slug: args.username },
          },
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
