import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import {
  RelativeValuesExport,
  getRelativeValuesExportForWriteableModel,
} from "../types/RelativeValuesExport";
import { decodeGlobalIdWithTypename } from "../utils";

builder.mutationField("clearRelativeValuesCache", (t) =>
  t.withAuth({ signedIn: true }).fieldWithInput({
    type: builder.simpleObject("ClearRelativeValuesCacheResult", {
      fields: (t) => ({
        relativeValuesExport: t.field({ type: RelativeValuesExport }),
      }),
    }),
    errors: {},
    input: {
      exportId: t.input.string({ required: true }),
    },
    resolve: async (_, { input }, { session }) => {
      const exportId = decodeGlobalIdWithTypename(
        input.exportId,
        "RelativeValuesExport"
      );

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
