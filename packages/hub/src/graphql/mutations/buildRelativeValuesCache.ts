import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import { cartesianProduct } from "@/relative-values/lib/utils";
import { relativeValuesItemsSchema } from "@/relative-values/types";
import { ModelEvaluator } from "@/relative-values/values/ModelEvaluator";
import { decodeGlobalID } from "@pothos/plugin-relay";

builder.mutationField("buildRelativeValuesCache", (t) =>
  t.fieldWithInput({
    type: builder.simpleObject("BuildRelativeValuesCacheResult", {
      fields: (t) => ({
        ok: t.boolean(),
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

      const relativeValuesExport =
        await prisma.relativeValuesExport.findUniqueOrThrow({
          where: { id },
          include: {
            definition: {
              select: {
                revisions: {
                  take: 1,
                  orderBy: {
                    createdAt: "desc",
                  },
                  select: {
                    items: true,
                  },
                },
              },
            },
            modelRevision: {
              select: {
                contentType: true,
                squiggleSnippet: true,
                model: {
                  select: {
                    owner: true,
                  },
                },
              },
            },
          },
        });

      const { modelRevision } = relativeValuesExport;

      if (modelRevision.model.owner.email !== email) {
        throw new Error("You don't own this model");
      }

      if (modelRevision.contentType !== "SquiggleSnippet") {
        throw new Error("Unsupported model revision content type");
      }

      const squiggleSnippet = modelRevision.squiggleSnippet;
      if (!squiggleSnippet) {
        throw new Error("Model content not found");
      }

      const evaluatorResult = ModelEvaluator.create(squiggleSnippet.code);
      if (!evaluatorResult.ok) {
        throw new Error(
          `Failed to create evaluator: ${evaluatorResult.value.toString()}`
        );
      }
      const evaluator = evaluatorResult.value;

      const definitionRevision = relativeValuesExport.definition.revisions[0];
      if (!definitionRevision) {
        throw new Error("Definition revision not found");
      }

      const items = relativeValuesItemsSchema.parse(definitionRevision.items);
      const itemIds = items.map((item) => item.id);

      for (const [firstItem, secondItem] of cartesianProduct(
        itemIds,
        itemIds
      )) {
        const result = evaluator.compareWithoutCache(firstItem, secondItem);
        await prisma.relativeValuesPairCache.create({
          data: {
            exportId: relativeValuesExport.id,
            firstItem,
            secondItem,
            ...(result.ok
              ? { result: result.value }
              : { error: result.value.toString() }),
          },
        });
      }

      return { ok: true };
    },
  })
);
