"use server";

import { z } from "zod";

import { actionClient } from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";
import { getWriteableOwnerOrSelf } from "@/owners/data/auth";
import { checkRootUser } from "@/users/auth";

const questionSchema = z.object({
  description: z.string().min(1, "Description is required"),
});

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  questions: z
    .array(questionSchema)
    .min(1, "At least one question is required"),
});

export const createQuestionSetAction = actionClient
  .schema(schema)
  .action(async ({ parsedInput: input }) => {
    await checkRootUser();

    // TODO - support group-owned question sets
    const owner = await getWriteableOwnerOrSelf();

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
      for (const question of input.questions) {
        const newQuestion = await tx.question.create({
          data: {
            description: question.description,
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
