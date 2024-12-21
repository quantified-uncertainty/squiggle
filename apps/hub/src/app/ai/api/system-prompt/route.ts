import { squiggleSystemPrompt } from "@quri/squiggle-ai/server";

export async function GET() {
  return new Response(squiggleSystemPrompt);
}
