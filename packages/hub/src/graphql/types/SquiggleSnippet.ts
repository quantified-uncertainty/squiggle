import { builder } from "@/graphql/builder";

export const SquiggleSnippet = builder.prismaNode("SquiggleSnippet", {
  id: { field: "id" },
  fields: (t) => ({
    code: t.exposeString("code"),
    version: t.exposeString("version"),
    seed: t.exposeString("seed"),
    autorunMode: t.exposeBoolean("autorunMode", { nullable: true }),
    sampleCount: t.exposeInt("sampleCount", { nullable: true }),
    xyPointLength: t.exposeInt("xyPointLength", { nullable: true }),
  }),
});
