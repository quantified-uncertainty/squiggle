import SchemaBuilder from "@pothos/core";
import PrismaPlugin from "@pothos/plugin-prisma";
import RelayPlugin from "@pothos/plugin-relay";

import { type PothosPrismaTypes, prisma } from "@quri/metaforecast-db";

export const builder = new SchemaBuilder<{
  PrismaTypes: PothosPrismaTypes;
  Scalars: {
    Date: {
      Input: Date;
      Output: Date;
    };
  };

  DefaultFieldNullability: false;
}>({
  plugins: [PrismaPlugin, RelayPlugin],
  prisma: {
    client: prisma,
  },
  defaultFieldNullability: false,
  relay: {
    clientMutationId: "omit",
    cursorType: "String",
    // these are required for some reason, though it's not documented and probably a bug
    brandLoadedObjects: undefined,
    encodeGlobalID: undefined,
    decodeGlobalID: undefined,
  },
});

builder.scalarType("Date", {
  description: "Date serialized as the Unix timestamp.",
  serialize: (d) => d.getTime() / 1000,
  parseValue: (d) => {
    return new Date(d as string); // not sure if this is correct, need to check
  },
});

builder.queryType({});
builder.mutationType({});
