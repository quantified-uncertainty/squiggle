import { defineCollection, defineConfig } from "@content-collections/core";
import {
  createMetaSchema,
  transformMDX,
} from "@fumadocs/content-collections/configuration";

import { apiDocs } from "@/content/collections/apiDocs.js";
import { rawApiDocs } from "@/content/collections/rawApiDocs";
import { mdxOptions } from "@/content/collections/utils";

// Config for https://www.content-collections.dev/.

const directory = "content/docs";

export const docs = defineCollection({
  name: "doc",
  directory,
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

export const meta = defineCollection({
  name: "meta",
  directory,
  include: "**/meta.json",
  parser: "json",
  schema: createMetaSchema,
});

export default defineConfig({
  collections: [docs, meta, apiDocs, rawApiDocs],
});
