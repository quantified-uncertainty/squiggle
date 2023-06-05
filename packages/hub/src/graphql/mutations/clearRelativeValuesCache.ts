import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import { decodeGlobalID } from "@pothos/plugin-relay";
import { RelativeValuesExport } from "../types/RelativeValuesExport";

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
      const { typename, id } = decodeGlobalID(input.exportId);
      if (typename !== "RelativeValuesExport") {
        throw new Error("Expected RelativeValuesExport id");
      }

      const relativeValuesExport =
        await prisma.relativeValuesExport.findUniqueOrThrow({
          where: { id: input.exportId },
          include: {
            modelRevision: {
              select: {
                model: {
                  select: {
                    owner: true,
                  },
                },
              },
            },
          },
        });

      if (
        relativeValuesExport.modelRevision.model.owner.email !==
        session.user.email
      ) {
        throw new Error("You don't own this model");
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
