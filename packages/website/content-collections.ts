import { defineCollection, defineConfig } from "@content-collections/core";
import {
  createMetaSchema,
  transformMDX,
} from "@fumadocs/content-collections/configuration";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

import squiggleGrammar from "@quri/squiggle-textmate-grammar/dist/squiggle.tmLanguage.json" assert { type: "json" };

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
    const mdx = await transformMDX(doc, context, {
      // https://fumadocs.vercel.app/docs/ui/math#add-plugins
      remarkPlugins: [remarkMath],
      rehypeCodeOptions: {
        langs: [
          // ...BUNDLED_LANGUAGES,
          "javascript",
          {
            name: "squiggle",
            ...squiggleGrammar,
          },
        ],
        themes: {
          light: "github-light",
        },
      },
      rehypePlugins: (v) => [rehypeKatex, ...v],
    });

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
  collections: [docs, meta],
});
