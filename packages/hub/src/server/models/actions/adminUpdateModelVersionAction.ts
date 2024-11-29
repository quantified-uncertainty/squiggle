"use server";
import { z } from "zod";

import { prisma } from "@/prisma";
import {
  checkRootUser,
  getSelf,
  getSessionOrRedirect,
} from "@/server/users/auth";
import { makeServerAction } from "@/server/utils";

// Admin-only query for upgrading model versions
export const adminUpdateModelVersionAction = makeServerAction(
  z.object({
    modelId: z.string(),
    version: z.string(),
  }),
  async (input) => {
    await checkRootUser();
    const session = await getSessionOrRedirect();

    const self = await getSelf(session);

    const model = await prisma.$transaction(async (tx) => {
      let model = await prisma.model.findUniqueOrThrow({
        where: { id: input.modelId },
        include: {
          currentRevision: {
            include: {
              squiggleSnippet: true,
              relativeValuesExports: true,
            },
          },
        },
      });
      if (!model.currentRevision) {
        throw new Error("currentRevision is missing");
      }
      if (
        model.currentRevision.contentType !== "SquiggleSnippet" ||
        !model.currentRevision.squiggleSnippet
      ) {
        throw new Error("Not a Squiggle model");
      }

      const revision = await tx.modelRevision.create({
        data: {
          squiggleSnippet: {
            create: {
              code: model.currentRevision.squiggleSnippet.code,
              version: input.version,
              seed: model.currentRevision.squiggleSnippet.seed,
            },
          },
          contentType: "SquiggleSnippet",
          model: {
            connect: { id: model.id },
          },
          author: {
            connect: { email: self.email! },
          },
          comment: `Automated upgrade from ${model.currentRevision.squiggleSnippet.version} to ${input.version}`,
          relativeValuesExports: {
            createMany: {
              data: model.currentRevision.relativeValuesExports.map((exp) => ({
                variableName: exp.variableName,
                definitionId: exp.definitionId,
              })),
            },
          },
        },
        include: {
          model: {
            select: {
              id: true,
            },
          },
        },
      });

      return await tx.model.update({
        where: {
          id: revision.model.id,
        },
        data: {
          currentRevisionId: revision.id,
          updatedAt: model.updatedAt,
        },
      });
    });

    return { model };
  }
);
