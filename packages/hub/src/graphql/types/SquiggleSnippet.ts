import { builder } from "@/graphql/builder";

export const SquiggleSnippet = builder.prismaNode("SquiggleSnippet", {
  id: { field: "id" },
  fields: (t) => ({
    code: t.exposeString("code"),
    version: t.exposeString("version"),
  }),
});
