import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import { decodeGlobalID } from "@pothos/plugin-relay";
import { RelativeValuesExport } from "../types/RelativeValuesExport";

builder.mutationField("clearRelativeValuesCache", (t) =>
  t.fieldWithInput({
    type: builder.simpleObject("ClearRelativeValuesCacheResult", {
      fields: (t) => ({
        relativeValuesExport: t.field({
          type: RelativeValuesExport,
          nullable: false,
        }),
      }),
    }),
    authScopes: {
      user: true,
    },
    errors: {},
    input: {
      exportId: t.input.string({ required: true }),
    },
    resolve: async (_, { input }, { session }) => {
      const { typename, id } = decodeGlobalID(input.exportId);
      if (typename !== "RelativeValuesExport") {
        throw new Error("Expected RelativeValuesExport id");
      }

      const email = session?.user.email;
      if (!email) {
        // shouldn't happen because we checked user auth scope previously, but helps with type checks
        throw new Error("Email is missing");
      }

      await prisma.relativeValuesPairCache.deleteMany({
        where: {
          exportId: id,
        },
      });

      const updatedRelativeValuesExport =
        await prisma.relativeValuesExport.findUniqueOrThrow({
          where: { id },
        });
      return { relativeValuesExport: updatedRelativeValuesExport };
    },
  })
);
