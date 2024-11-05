import { defineCollection } from "@content-collections/core";
import { transformMDX } from "@fumadocs/content-collections/configuration";

import { mdxOptions } from "@/collections/utils.js";

/*
 * Collection for `/docs` documentation pages.
 *
 * Note that there are no `Api/` docs in this collection; API docs are stored in
 * `apiDocs` collection.
 *
 * The key reason for this is that API docs have a different frontmatter schema
 * (no `title` field; `sections` list). This means that we have to inject API
 * docs in the website's `source.ts` config, though. Maybe we should inject them
 * here in `transform` instead.
 */
export const docs = defineCollection({
  name: "doc",
  directory: "content/docs",
  include: ["**/*.mdx", "**/*.md"],
  schema: (z) => ({
    title: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
  }),
  transform: async (doc, context) => {
    const mdx = await transformMDX(doc, context, mdxOptions);

    // TODO - lastModifiedTime from git or github?
    // We had this when we used fumadocs-mdx, but there's no direct analog in content-collections.

    const title =
      mdx.title || mdx._meta.fileName.replace(/\.mdx?/, "").replace("-", " ");

    return {
      ...mdx,
      title,
      description: mdx.description ?? "",
    };
  },
});
