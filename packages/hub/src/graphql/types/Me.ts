import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import { User } from "./User";

export const Me = builder
  .objectRef<{ email: string; username?: string | undefined | null }>("Me")
  .implement({
    authScopes: {
      signedIn: true,
    },
    fields: (t) => ({
      email: t.exposeString("email"),
      username: t.exposeString("username", { nullable: true }),
      asUser: t.withAuth({ signedIn: true }).prismaField({
        type: User,
        resolve: async (query, _, __, { session }) => {
          return await prisma.user.findUniqueOrThrow({
            ...query,
            where: { email: session.user.email },
          });
        },
      }),
    }),
  });
