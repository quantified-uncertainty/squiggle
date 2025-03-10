"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { modelForRelativeValuesExportRoute } from "@/lib/routes";
import { actionClient, ActionError } from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";
import { cartesianProduct } from "@/relative-values/lib/utils";
import { relativeValuesItemsSchema } from "@/relative-values/types";
import { ModelEvaluator } from "@/relative-values/values/ModelEvaluator";

import { getRelativeValuesExportForWriteableModel } from "../utils";

export const buildRelativeValuesCacheAction = actionClient
  .schema(
    z.object({
      exportId: z.string(),
    })
  )
  .action(async ({ parsedInput: { exportId } }): Promise<void> => {
    const relativeValuesExport = await getRelativeValuesExportForWriteableModel(
      {
        exportId,
      }
    );

    const { modelRevision } = relativeValuesExport;

    if (modelRevision.contentType !== "SquiggleSnippet") {
      throw new ActionError("Unsupported model revision content type");
    }

    const squiggleSnippet = modelRevision.squiggleSnippet;
    if (!squiggleSnippet) {
      throw new ActionError("Model content not found");
    }

    const evaluatorResult = await ModelEvaluator.create(
      squiggleSnippet.code,
      relativeValuesExport.variableName
    );
    if (!evaluatorResult.ok) {
      throw new ActionError(
        `Failed to create evaluator: ${evaluatorResult.value.toString()}`
      );
    }
    const evaluator = evaluatorResult.value;

    const definitionRevision = relativeValuesExport.definition.currentRevision;
    if (!definitionRevision) {
      throw new ActionError("Definition revision not found");
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

    revalidatePath(
      modelForRelativeValuesExportRoute({
        owner: relativeValuesExport.modelRevision.model.owner.slug,
        slug: relativeValuesExport.modelRevision.model.slug,
        variableName: relativeValuesExport.variableName,
      })
    );
  });
