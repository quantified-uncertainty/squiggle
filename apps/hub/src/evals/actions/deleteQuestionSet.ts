"use server";
import { z } from "zod";

import { actionClient } from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";
import { checkRootUser } from "@/users/auth";

const schema = z.object({
  questionSetId: z.string(),
});

export const deleteQuestionSet = actionClient
  .schema(schema)
  .action(async ({ parsedInput: { questionSetId } }) => {
    await checkRootUser();

    const questionSetExists = await prisma.questionSet.delete({
      where: { id: questionSetId },
    });

    return true;
  });
