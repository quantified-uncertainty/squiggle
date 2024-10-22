import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
  metaSchema,
} from "fumadocs-mdx/config";
import { z } from "zod";

export const { docs, meta } = defineDocs({
  docs: {
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
        v.title ||
        v._file.absolutePath
          .split("/")
          .at(-1)!
          .replace(/\.mdx?/, "")
          .replace("-", " ");

      return {
        ...v,
        title,
      };
    },
  },
  meta: {
    dir: "src/content/docs",
    schema: metaSchema,
  },
});

export default defineConfig();
