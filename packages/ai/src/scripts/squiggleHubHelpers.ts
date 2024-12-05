import { z } from "zod";

const SERVER = "https://squigglehub.org";

export async function fetchCodeFromHub(
  owner: string,
  slug: string
): Promise<string> {
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
}

export async function fetchGroupModels(groupSlug: string): Promise<string[]> {
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
}
