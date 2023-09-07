import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import { decodeGlobalID } from "@pothos/plugin-relay";
import {
  RelativeValuesExport,
  getRelativeValuesExportForWriteableModel,
} from "../types/RelativeValuesExport";

builder.mutationField("clearRelativeValuesCache", (t) =>
  t.withAuth({ user: true }).fieldWithInput({
    type: builder.simpleObject("ClearRelativeValuesCacheResult", {
      fields: (t) => ({
        relativeValuesExport: t.field({
          type: RelativeValuesExport,
          nullable: false,
        }),
      }),
    }),
    errors: {},
    input: {
      exportId: t.input.string({ required: true }),
    },
    resolve: async (_, { input }, { session }) => {
      const { typename, id: exportId } = decodeGlobalID(input.exportId);
      if (typename !== "RelativeValuesExport") {
        throw new Error("Expected RelativeValuesExport id");
      }

      await getRelativeValuesExportForWriteableModel({
        exportId,
        session,
      });

      await prisma.relativeValuesPairCache.deleteMany({
        where: { exportId },
      });

      const updatedRelativeValuesExport =
        await prisma.relativeValuesExport.findUniqueOrThrow({
          where: { id: exportId },
        });
      return { relativeValuesExport: updatedRelativeValuesExport };
    },
  })
);
