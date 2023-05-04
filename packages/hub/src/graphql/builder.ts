import SchemaBuilder from "@pothos/core";
import SimpleObjectsPlugin from "@pothos/plugin-simple-objects";
import ScopeAuthPlugin from "@pothos/plugin-scope-auth";

import { Session } from "next-auth";
import { NextRequest } from "next/server";

export const builder = new SchemaBuilder<{
  Context: {
    session: Session | null;
    request: NextRequest;
  };
  AuthScopes: {
    user: boolean;
  };
}>({
  plugins: [SimpleObjectsPlugin, ScopeAuthPlugin],
  authScopes: async (context) => ({
    user: !!context.session?.user,
  }),
});

builder.queryType({});
builder.mutationType({});
