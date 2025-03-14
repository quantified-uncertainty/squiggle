"use server";
import { z } from "zod";

import { LlmId, MODEL_CONFIGS } from "@quri/squiggle-ai";

import { actionClient } from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";
import { checkRootUser } from "@/users/auth";

// Schema for LLM config
const LlmConfigSchema = z.object({
  llmId: z.enum(MODEL_CONFIGS.map((m) => m.id) as [LlmId, ...LlmId[]]),
  priceLimit: z.number().min(0),
  durationLimitMinutes: z.number().min(1),
  messagesInHistoryToKeep: z.number().int().min(1),
  numericSteps: z.number().int().min(0),
  styleGuideSteps: z.number().int().min(0),
});

// Input schema for creating an evaluator
const createEvaluatorSchema = z.object({
  name: z.string().min(1),
  config: LlmConfigSchema,
});

export const createEvaluatorAction = actionClient
  .schema(createEvaluatorSchema)
  .action(async ({ parsedInput }) => {
    await checkRootUser();

    // Create the evaluator in the database
    const evaluator = await prisma.evaluator.create({
      data: {
        name: parsedInput.name,
        type: "SquiggleAI",
        config: parsedInput.config,
      },
    });

    return evaluator;
  });
