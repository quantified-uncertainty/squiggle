import { getDocumentationBundle } from "@quri/content";

export async function GET() {
  return new Response(await getDocumentationBundle());
}
