import { defineCollection } from "@content-collections/core";
import { z } from "zod";

const SERVER = "https://squigglehub.org";

function getGraphqlQuery(owner: string, slug: string) {
  return `
    query GetModelCode {
      model(input: {owner: "${owner}", slug: "${slug}"}) {
        ... on Model {
          id
          currentRevision {
            content {
              ... on SquiggleSnippet {
                id
                code
              }
            }
          }
        }
      }
    }
    `;
}

export async function fetchCodeFromHubLegacy(
  owner: string,
  slug: string
): Promise<string> {
  const query = getGraphqlQuery(owner, slug);
  const response = await fetch("https://squigglehub.org/api/graphql", {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ query }),
  });
  const json = await response.json();
  const code = (json as any).data.model.currentRevision.content.code;
  if (typeof code !== "string") {
    throw new Error(`Invalid response: ${JSON.stringify(json, null, 2)}`);
  }
  return code;
}

// copy-pasted from squiggle/internal/ai/src/scripts/squiggleHubHelpers.ts
export async function fetchCodeFromHub(
  owner: string,
  slug: string
): Promise<string> {
  try {
    const data = await fetch(
      `${SERVER}/api/get-source?${new URLSearchParams({
        owner,
        slug,
      })}`
    ).then((res) => res.json());
    const parsed = z.object({ code: z.string() }).safeParse(data);
    if (!parsed.success) {
      throw new Error(`Failed to fetch source for ${owner}/${slug}`);
    }

    return parsed.data.code;
  } catch {
    return await fetchCodeFromHubLegacy(owner, slug);
  }
}

export const squiggleAiLibraries = defineCollection({
  name: "squiggleAiLibraries",
  directory: "content/squiggleAiLibraries",
  include: "**/*.yaml",
  parser: "yaml",
  schema: (z) => ({
    owner: z.string(),
    slug: z.string(),
  }),
  transform: async (data) => {
    const code = await fetchCodeFromHub(data.owner, data.slug);
    const importName = `hub:${data.owner}/${data.slug}`;

    return { ...data, importName, code };
  },
});
