"use server";

import { z } from "zod";

import { actionClient } from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";
import { checkRootUser } from "@/users/auth";

const specSchema = z.object({
  description: z.string().min(1, "Description is required"),
});

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  specs: z.array(specSchema).min(1, "At least one spec is required"),
});

export const createSpecListAction = actionClient
  .schema(schema)
  .action(async ({ parsedInput: input }) => {
    await checkRootUser();

    // Create the speclist and specs in a transaction
    const specList = await prisma.$transaction(async (tx) => {
      // Create specList
      const newSpecList = await tx.specList.create({
        data: {
          name: input.name,
        },
        select: { id: true },
      });

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
            specListId: newSpecList.id,
          },
        });
      }

      // Return the created specList with specs
      return await tx.specList.findUniqueOrThrow({
        where: { id: newSpecList.id },
        include: {
          specs: {
            include: {
              spec: true,
            },
          },
        },
      });
    });

    return {
      id: specList.id,
    };
  });
