import { prisma } from "@/prisma";
import { builder } from "../builder";

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

type GenericError = {
  message: string;
  genericError: true;
};

const GenericError = builder.objectRef<GenericError>("GenericError").implement({
  fields: (t) => ({
    message: t.exposeString("message"),
  }),
});

function genericError(message: string): GenericError {
  return {
    genericError: true,
    message,
  };
}

const SetUsernameResult = builder.unionType("SetUsernameResult", {
  types: [Me, GenericError],
  resolveType: (fact) => {
    if ("genericError" in fact) {
      return GenericError;
    } else {
      return Me;
    }
  },
});

builder.mutationField("setUsername", (t) =>
  t.field({
    type: SetUsernameResult,
    authScopes: {
      user: true,
    },
    args: {
      username: t.arg.string({ required: true }),
    },
    async resolve(_, args, { session }) {
      const email = session?.user.email;
      if (!email) {
        return genericError("Email is missing");
      }
      if (session.user.username) {
        return genericError("Username is already set");
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
