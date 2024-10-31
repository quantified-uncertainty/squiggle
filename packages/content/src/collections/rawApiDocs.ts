import { defineCollection } from "@content-collections/core";

import { getApiDocSchema } from "./apiDocs.js";
import { docTitleFromMeta } from "./utils.js";

/*
 * Collection of API docs, for AI prompt consumption.
 *
 * Unlike `./apiDocs.ts` collection, this collection doesn't compile MDX or inject sections.
 */
export const rawApiDocs = defineCollection({
  name: "rawApiDocs",
  directory: "content/api",
  include: "**/*.mdx",
  schema: getApiDocSchema,
  transform: async (doc) => {
    return {
      ...doc,
      title: docTitleFromMeta(doc._meta),
      description: doc.description ?? "",
    };
  },
});
