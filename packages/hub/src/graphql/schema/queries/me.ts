import { builder } from "@/graphql/builder";
import { Me } from "../types/me";

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
