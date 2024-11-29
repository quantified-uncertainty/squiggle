"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/prisma";
import { cartesianProduct } from "@/relative-values/lib/utils";
import { relativeValuesItemsSchema } from "@/relative-values/types";
import { ModelEvaluator } from "@/relative-values/values/ModelEvaluator";
import { modelForRelativeValuesExportRoute } from "@/routes";
import { getSessionOrRedirect } from "@/server/users/auth";
import { makeServerAction } from "@/server/utils";

import { getRelativeValuesExportForWriteableModel } from "../../../graphql/types/RelativeValuesExport";

export const buildRelativeValuesCacheAction = makeServerAction(
  z.object({
    exportId: z.string(),
  }),
  async (input): Promise<void> => {
    const session = await getSessionOrRedirect();

    const exportId = input.exportId;

    const relativeValuesExport = await getRelativeValuesExportForWriteableModel(
      {
        exportId,
        session,
      }
    );

    const { modelRevision } = relativeValuesExport;

    if (modelRevision.contentType !== "SquiggleSnippet") {
      throw new Error("Unsupported model revision content type");
    }

    const squiggleSnippet = modelRevision.squiggleSnippet;
    if (!squiggleSnippet) {
      throw new Error("Model content not found");
    }

    const evaluatorResult = await ModelEvaluator.create(
      squiggleSnippet.code,
      relativeValuesExport.variableName
    );
    if (!evaluatorResult.ok) {
      throw new Error(
        `Failed to create evaluator: ${evaluatorResult.value.toString()}`
      );
    }
    const evaluator = evaluatorResult.value;

    const definitionRevision = relativeValuesExport.definition.currentRevision;
    if (!definitionRevision) {
      throw new Error("Definition revision not found");
    }

    const items = relativeValuesItemsSchema.parse(definitionRevision.items);
    const itemIds = items.map((item) => item.id);

    const existingCacheItems = await prisma.relativeValuesPairCache.findMany({
      where: {
        exportId,
      },
      select: {
        firstItem: true,
        secondItem: true,
      },
    });

    const seen: Record<string, Record<string, boolean>> = {};
    for (const row of existingCacheItems) {
      seen[row.firstItem] ??= {};
      seen[row.firstItem][row.secondItem] = true;
    }

    for (const [firstItem, secondItem] of cartesianProduct(itemIds, itemIds)) {
      if (seen[firstItem]?.[secondItem]) {
        continue; // already cached
      }
      const result = evaluator.compareWithoutCache(firstItem, secondItem);
      await prisma.relativeValuesPairCache.create({
        data: {
          exportId,
          firstItem,
          secondItem,
          ...(result.ok
            ? { result: result.value }
            : { error: result.value.toString() }),
        },
      });
    }

    // check that the export still exists - is this useful?
    await prisma.relativeValuesExport.findUniqueOrThrow({
      where: { id: exportId },
      select: {
        id: true,
      },
    });

    // sleep
    await new Promise((resolve) => setTimeout(resolve, 1000));

    revalidatePath(
      modelForRelativeValuesExportRoute({
        owner: relativeValuesExport.modelRevision.model.owner.slug,
        slug: relativeValuesExport.modelRevision.model.slug,
        variableName: relativeValuesExport.variableName,
      })
    );
  }
);
