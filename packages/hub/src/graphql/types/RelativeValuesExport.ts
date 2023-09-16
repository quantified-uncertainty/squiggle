import { Session } from "next-auth";

import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { getWriteableModel } from "./Model";

export async function getRelativeValuesExportForWriteableModel({
  exportId,
  session,
}: {
  exportId: string;
  session: Session;
}) {
  const relativeValuesExport =
    await prisma.relativeValuesExport.findUniqueOrThrow({
      where: { id: exportId },
      // Selecting a bit too much, for the sake of `buildRelativeValuesCache`
      // (even though this function is also used in `clearRelativeValuesCache` where this data is not needed)
      include: {
        definition: {
          include: {
            currentRevision: true,
          },
        },
        modelRevision: {
          include: {
            squiggleSnippet: true,
            model: {
              include: {
                owner: true,
              },
            },
          },
        },
      },
    });

  // checking permissions
  await getWriteableModel({
    session,
    owner: relativeValuesExport.modelRevision.model.owner.slug,
    slug: relativeValuesExport.modelRevision.model.slug,
  });

  return relativeValuesExport;
}

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
