import { builder } from "@/graphql/builder";

import { rebuildSearchableTable } from "../helpers/searchHelpers";

builder.mutationField("adminRebuildSearchIndex", (t) =>
  t.withAuth({ signedIn: true }).field({
    description: "Admin-only query for rebuilding the search index",
    type: builder.simpleObject("AdminRebuildSearchIndexResult", {
      fields: (t) => ({
        ok: t.boolean(),
      }),
    }),
    errors: {},
    authScopes: {
      isRootUser: true,
    },
    resolve: async (_, { input }, { session }) => {
      await rebuildSearchableTable();
      return { ok: true };
    },
  })
);
