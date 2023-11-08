import { prisma } from "@/prisma";
import { builder } from "@/graphql/builder";

import { Model } from "../types/Model";
import { getSelf } from "../types/User";
import { decodeGlobalIdWithTypename } from "../utils";

builder.mutationField("adminUpdateModelVersion", (t) =>
  t.withAuth({ signedIn: true }).fieldWithInput({
    description: "Admin-only query for upgrading model versions",
    type: builder.simpleObject("AdminUpdateModelVersionResult", {
      fields: (t) => ({
        model: t.field({ type: Model }),
      }),
    }),
    errors: {},
    authScopes: {
      isRootUser: true,
    },
    input: {
      modelId: t.input.string({ required: true }),
      version: t.input.string({ required: true }),
    },
    resolve: async (_, { input }, { session }) => {
      const decodedModelId = decodeGlobalIdWithTypename(input.modelId, "Model");
      const self = await getSelf(session);

      const model = await prisma.$transaction(async (tx) => {
        let model = await prisma.model.findUniqueOrThrow({
          where: { id: decodedModelId },
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
                data: model.currentRevision.relativeValuesExports.map(
                  (exp) => ({
                    variableName: exp.variableName,
                    definitionId: exp.definitionId,
                  })
                ),
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
          // TODO - optimize with queryFromInfo, https://pothos-graphql.dev/docs/plugins/prisma#optimized-queries-without-tprismafield
        });
      });

      return { model };
    },
  })
);
