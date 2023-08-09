import { builder } from "@/graphql/builder";
import { modelWhereHasAccess } from "./Model";

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
    modelRevision: t.relation("modelRevision"),
    variableName: t.exposeString("variableName"),
    cache: t.relation("cache"),
  }),
});
