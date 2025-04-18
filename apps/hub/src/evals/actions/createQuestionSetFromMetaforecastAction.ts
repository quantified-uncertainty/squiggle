"use server";

import { z } from "zod";

import { prisma as metaforecastPrisma } from "@quri/metaforecast-db";

import { actionClient } from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";
import { getWriteableOwnerOrSelf } from "@/owners/data/auth";
import { checkRootUser } from "@/users/auth";

import { parseQuestionMetadata } from "../lib/questionMetadata";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  manifoldMarketIds: z
    .array(z.string())
    .min(1, "At least one question id is required"),
});

export const createQuestionSetFromMetaforecastAction = actionClient
  .schema(schema)
  .action(async ({ parsedInput: input }) => {
    await checkRootUser();

    // TODO - support group-owned question sets
    const owner = await getWriteableOwnerOrSelf();

    const markets = await metaforecastPrisma.manifoldMarket.findMany({
      where: {
        id: {
          in: input.manifoldMarketIds,
        },
      },
      select: {
        id: true,
        question: true,
        textDescription: true,
        url: true,
      },
    });

    // Create the question set and questions in a transaction
    const questionSet = await prisma.$transaction(async (tx) => {
      // Create questionSet
      const newQuestionSet = await tx.questionSet.create({
        data: {
          name: input.name,
          ownerId: owner.id,
        },
        select: { id: true },
      });

      // Create questions and connect them to the questionSet
      for (const market of markets) {
        // TODO - store the manifoldMarketId in the question or its metadata
        const description = `${market.question}

# Full Description
${market.textDescription}
        `;

        const newQuestion = await tx.question.create({
          data: {
            description,
            ownerId: owner.id,
            metadata: parseQuestionMetadata({
              manifold: {
                marketId: market.id,
                marketUrl: market.url,
              },
            }),
          },
        });

        await tx.questionsOnQuestionSets.create({
          data: {
            questionId: newQuestion.id,
            questionSetId: newQuestionSet.id,
          },
        });
      }

      // Return the created questionSet with questions
      // TODO - use DTOs instead of raw prisma models
      return await tx.questionSet.findUniqueOrThrow({
        where: { id: newQuestionSet.id },
        include: {
          questions: {
            include: {
              question: true,
            },
          },
        },
      });
    });

    return {
      id: questionSet.id,
    };
  });
