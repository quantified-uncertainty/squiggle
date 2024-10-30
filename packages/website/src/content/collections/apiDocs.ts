import { defineCollection, Schema } from "@content-collections/core";
import { transformMDX } from "@fumadocs/content-collections/configuration";
import { z as zod } from "zod";

import { generateApiFunctionSection } from "../apiUtils";
import { docTitleFromMeta, mdxOptions } from "./utils";

export function getApiDocSchema(z: typeof zod) {
  return {
    description: z.string().optional().nullable(),
    sections: z
      .array(
        z.object({
          name: z.string(),
          description: z.string().optional().nullable(),
        })
      )
      .optional(),
  };
}

export type ApiModuleDoc = Schema<
  "frontmatter",
  ReturnType<typeof getApiDocSchema>
>;

/*
 * Collection for `/docs/API` documentation pages.
 *
 * Automatically adds functions documentation to the page based on builtin documentation from squiggle-lang.
 *
 * Note that there's no `meta.json` file for fumadocs in this collection; since
 * it's a single file, it's easier to generate it in `app/source.ts`.
 */
export const apiDocs = defineCollection({
  name: "apiDocs",
  directory: "content/api",
  include: "**/*.mdx",
  schema: getApiDocSchema,
  transform: async (doc, context) => {
    const title = docTitleFromMeta(doc._meta);

    doc.content += "\n\n" + generateApiFunctionSection(doc);
    const mdx = await transformMDX(doc, context, mdxOptions);

    return {
      ...mdx,
      title,
      description: mdx.description ?? "",
    };
  },
});
