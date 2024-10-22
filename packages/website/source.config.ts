import {
  defineCollections,
  defineConfig,
  frontmatterSchema,
} from "fumadocs-mdx/config";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { z } from "zod";

import squiggleGrammar from "@quri/squiggle-textmate-grammar/dist/squiggle.tmLanguage.json" assert { type: "json" };

const dir = "src/content/docs";

export const docs = defineCollections({
  type: "doc",
  dir: "src/content/docs",
  schema: frontmatterSchema
    .extend({
      // fumadocs requires title and description to be defined, but we inject them in React
      title: z.string().nullable().default(""),
      description: z.string().nullable().default(""),
    })
    .transform((v) => ({
      ...v,
      title: v.title ?? "",
      description: v.description ?? "",
    })),
  transform: (v) => {
    const title =
      // fumadocs types are wrong
      (v as any).title ||
      (v as any)._file.absolutePath
        .split("/")
        .at(-1)!
        .replace(/\.mdx?/, "")
        .replace("-", " ");

    return {
      ...v,
      title,
    };
  },
});

export const meta = defineCollections({
  type: "meta",
  dir,
});

export default defineConfig({
  mdxOptions: {
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
  },
});
