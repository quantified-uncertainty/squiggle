import { defineCollection } from "@content-collections/core";
import { z } from "zod";

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
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    pages: z.array(z.string()).optional(),
    icon: z.string().optional(),
    root: z.boolean().optional(),
    defaultOpen: z.boolean().optional(),
  }),
});
