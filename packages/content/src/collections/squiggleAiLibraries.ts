import { defineCollection } from "@content-collections/core";

const GRAPHQL_URL = "https://squigglehub.org/api/graphql";

export function getQuery(owner: string, slug: string) {
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

export async function fetchCodeFromGraphQL(
  owner: string,
  slug: string
): Promise<string> {
  const query = getQuery(owner, slug);
  const response = await fetch(GRAPHQL_URL, {
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

export function getGroupModelsQuery(groupSlug: string) {
  return {
    query: `
      query GetGroupModels($groupSlug: String!) {
        group(slug: $groupSlug) {
          ... on Group {
            id
            models(first: 50) {
              edges {
                node {
                  currentRevision {
                    content {
                      ... on SquiggleSnippet {
                        code
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `,
    variables: { groupSlug },
  };
}

export async function fetchGroupModels(groupSlug: string): Promise<string[]> {
  try {
    const query = getGroupModelsQuery(groupSlug);
    const response = await fetch(GRAPHQL_URL, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(query),
    });

    if (response.status === 200) {
      const json = await response.json();
      const models = (json as any).data.group.models.edges;
      console.log(`Fetched ${models.length} models from group ${groupSlug}`);

      return models.map(
        (model: { node: { currentRevision: { content: { code: string } } } }) =>
          model.node.currentRevision.content.code
      );
    } else {
      throw new Error(`Error fetching group models: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error fetching group models:", error);
    throw error;
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
    const code = await fetchCodeFromGraphQL(data.owner, data.slug);
    const importName = `hub:${data.owner}/${data.slug}`;

    return { ...data, importName, code };
  },
});
