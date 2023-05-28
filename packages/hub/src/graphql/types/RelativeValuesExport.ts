import { builder } from "@/graphql/builder";

export const RelativeValuesPairCache = builder.prismaNode(
  "RelativeValuesPairCache",
  {
    id: { field: "id" },
    fields: (t) => ({
      firstItem: t.exposeString("firstItem"),
      secondItem: t.exposeString("secondItem"),
      resultJSON: t.string({
        resolve(obj) {
          return JSON.stringify(obj.result);
        },
      }),
      errorString: t.exposeString("error", { nullable: true }),
    }),
  }
);

export const RelativeValuesExport = builder.prismaNode("RelativeValuesExport", {
  id: { field: "id" },
  fields: (t) => ({
    definition: t.relation("definition"),
    variableName: t.exposeString("variableName"),
    cache: t.relation("cache"),
  }),
});
