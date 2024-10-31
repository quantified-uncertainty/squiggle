import { defineCollection } from "@content-collections/core";
import { createMetaSchema } from "@fumadocs/content-collections/configuration";

/*
 * Collection for `meta.json` files in `/docs` directory.
 *
 * This is used to generate the sidebar in the website.
 *
 * Note that it doesn't include metadata for API docs; check out the comment in
 * `./docs.ts` for details.
 */
export const meta = defineCollection({
  name: "meta",
  directory: "content/docs",
  include: "**/meta.json",
  parser: "json",
  schema: createMetaSchema,
});
