import "server-only";

import { makeAiCodec } from "@quri/squiggle-ai/server";

export function getAiCodec() {
  const openaiApiKey = process.env["OPENROUTER_API_KEY"];
  const anthropicApiKey = process.env["ANTHROPIC_API_KEY"];
  return makeAiCodec({
    openaiApiKey,
    anthropicApiKey,
  });
}
