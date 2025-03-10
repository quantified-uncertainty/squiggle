import { z } from "zod";

import { prisma } from "@quri/metaforecast-db";

import { saveQuestionsWithStats } from "./dbUtils";
import { Platform } from "./types";

export async function getPlatformState<TState extends z.ZodTypeAny>(
  platform: Platform<TState>
): Promise<z.infer<TState> | null> {
  if (!platform.stateSchema) {
    throw new Error("Platform has no state schema");
  }
  const state = await prisma.platformState.findUnique({
    where: {
      platform: platform.name,
    },
  });
  if (!state) {
    return null;
  }

  // TODO - recover from errors?
  const parsed = platform.stateSchema.parse(state.state);
  return parsed;
}

export async function setPlatformState<TState extends z.ZodTypeAny>(
  platform: Platform<TState>,
  state: z.infer<TState>
) {
  await prisma.platformState.upsert({
    where: {
      platform: platform.name,
    },
    update: {
      state,
    },
    create: {
      platform: platform.name,
      state,
    },
  });
}

// Run the platform's daily fetcher and save the results.
export async function processPlatform(platform: Platform) {
  if (!platform.fetcher) {
    console.log(`Platform ${platform.name} doesn't have a fetcher, skipping`);
    return;
  }
  const result = await platform.fetcher();

  if (!result || !result.questions) {
    console.log(`Platform ${platform.name} didn't return any results`);
    return;
  }

  const { questions } = result;

  await saveQuestionsWithStats({
    platform,
    fetchedQuestions: questions,
    replaceAll: true,
  });
}
