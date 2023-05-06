import SchemaBuilder from "@pothos/core";

import SimpleObjectsPlugin from "@pothos/plugin-simple-objects";
import ScopeAuthPlugin from "@pothos/plugin-scope-auth";
import RelayPlugin from "@pothos/plugin-relay";
import PrismaPlugin from "@pothos/plugin-prisma";
import WithInputPlugin from "@pothos/plugin-with-input";
import ErrorsPlugin from "@pothos/plugin-errors";
import ValidationPlugin from "@pothos/plugin-validation";

import type PrismaTypes from "@pothos/plugin-prisma/generated";

import { Session } from "next-auth";
import { NextRequest } from "next/server";
import { prisma } from "@/prisma";

export const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes;
  DefaultEdgesNullability: false;
  Context: {
    session: Session | null;
    request: NextRequest;
  };
  AuthScopes: {
    user: boolean;
  };
}>({
  plugins: [
    // this plugin comes before auth plugin; see also: https://github.com/hayes/pothos/issues/464
    ErrorsPlugin, // https://pothos-graphql.dev/docs/plugins/errors
    ScopeAuthPlugin, // https://pothos-graphql.dev/docs/plugins/scope-auth
    SimpleObjectsPlugin, // https://pothos-graphql.dev/docs/plugins/simple-objects
    WithInputPlugin, // https://pothos-graphql.dev/docs/plugins/with-input
    PrismaPlugin, // https://pothos-graphql.dev/docs/plugins/prisma
    RelayPlugin, // https://pothos-graphql.dev/docs/plugins/relay
    ValidationPlugin, // https://pothos-graphql.dev/docs/plugins/validation
  ],
  prisma: {
    client: prisma,
  },
  relayOptions: {
    clientMutationId: "omit",
    cursorType: "String",
    edgesFieldOptions: {
      nullable: false,
    },
  },
  authScopes: async (context) => ({
    user: !!context.session?.user,
  }),
  errorOptions: {
    defaultTypes: [Error],
    directResult: true,
  },
});

export const ErrorInterface = builder.interfaceRef<Error>("Error").implement({
  fields: (t) => ({
    message: t.exposeString("message"),
  }),
});

builder.objectType(Error, {
  name: "BaseError",
  interfaces: [ErrorInterface],
});

builder.queryType({});
builder.mutationType({});
