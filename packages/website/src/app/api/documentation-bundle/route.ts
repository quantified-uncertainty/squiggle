import { getDocumentationBundle } from "@/content/prompts";

export async function GET() {
  return new Response(await getDocumentationBundle());
}
