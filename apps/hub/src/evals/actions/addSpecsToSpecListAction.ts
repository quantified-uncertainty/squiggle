"use server";

import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

import { prisma } from "@/lib/server/prisma";
import { actionClient } from "@/lib/server/actionClient";
import { getSessionOrRedirect } from "@/users/auth";

const specSchema = z.object({
  description: z.string().min(1, "Description is required"),
});

const schema = z.object({
  specListId: z.string().min(1, "SpecList ID is required"),
  specs: z.array(specSchema).min(1, "At least one spec is required"),
});

export const addSpecsToSpecListAction = actionClient
  .schema(schema)
  .action(async ({ parsedInput: input }) => {
    // Check if user is authenticated
    await getSessionOrRedirect();

    try {
      // Verify the specList exists
      const specList = await prisma.specList.findUniqueOrThrow({
        where: { id: input.specListId },
      });

      // Add specs to the specList in a transaction
      await prisma.$transaction(async (tx) => {
        // Create specs and connect them to the specList
        for (const spec of input.specs) {
          const newSpec = await tx.spec.create({
            data: {
              description: spec.description,
            },
          });

          await tx.specsOnSpecLists.create({
            data: {
              specId: newSpec.id,
              specListId: specList.id,
            },
          });
        }
      });

      // Return the updated specList
      return {
        id: specList.id,
        url: `/speclists/${specList.id}`,
        message: `Added ${input.specs.length} spec(s) to "${specList.name}"`,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("findUniqueOrThrow")) {
        returnValidationErrors(schema, {
          specListId: {
            _errors: ["SpecList not found"],
          },
        });
      }
      throw error;
    }
  });