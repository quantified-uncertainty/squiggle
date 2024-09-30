import axios from "axios";

export const librariesToImport = ["ozziegooen/sTest", "ozziegooen/helpers"];

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
  const response = await axios.post(GRAPHQL_URL, { query });
  return response.data.data.model.currentRevision.content.code;
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
    const response = await axios.post(GRAPHQL_URL, query);

    if (response.status === 200) {
      const models = response.data.data.group.models.edges;
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
