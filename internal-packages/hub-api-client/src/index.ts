import { z } from "zod";

const SERVER = "https://squigglehub.org";

/**
 * Hub API client for interacting with Squiggle Hub
 */
export const hubApi = {
  /**
   * Get Squiggle code by owner and slug.
   * Returns the Squiggle code as a string.
   */
  async getModelCode(owner: string, slug: string): Promise<string> {
    const url = new URL("/api/get-source", SERVER);
    url.searchParams.set("owner", owner);
    url.searchParams.set("slug", slug);

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Model not found: ${owner}/${slug}`);
      }
      throw new Error(`Failed to fetch source: ${response.statusText}`);
    }

    const data = await response.json();
    const parsed = z.object({ code: z.string() }).safeParse(data);
    if (!parsed.success) {
      throw new Error(`Failed to fetch source for ${owner}/${slug}`);
    }

    return parsed.data.code;
  },

  /**
   * Fetch all model slugs for a group.
   * Returns an array of model slugs belonging to the group.
   */
  async getGroupModelSlugs(groupSlug: string): Promise<string[]> {
    const data = await fetch(
      `${SERVER}/api/get-group-models?${new URLSearchParams({ slug: groupSlug })}`
    ).then((res) => res.json());

    const parsed = z
      .object({ models: z.array(z.object({ slug: z.string() })) })
      .safeParse(data);
    if (!parsed.success) {
      throw new Error(`Failed to fetch group models for ${groupSlug}`);
    }

    return parsed.data.models.map((item) => item.slug);
  },
};
