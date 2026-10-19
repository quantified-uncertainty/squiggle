import { getDocumentationBundle } from "@quri/content";

// The complete documentation in one file, following https://llmstxt.org/.

export const dynamic = "force-static";

export async function GET() {
  return new Response(await getDocumentationBundle(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
