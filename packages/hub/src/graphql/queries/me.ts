import { builder } from "@/graphql/builder";

import { Me } from "../types/Me";

builder.queryField("me", (t) =>
  t.withAuth({ signedIn: true }).field({
    type: Me,
    async resolve(_, __, { session }) {
      return session.user;
    },
  })
);
