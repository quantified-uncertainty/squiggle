import { defineConfig } from "@content-collections/core";

import { apiDocs } from "@/collections/apiDocs.js";
import { docs } from "@/collections/docs.js";
import { meta } from "@/collections/meta.js";
import { rawApiDocs } from "@/collections/rawApiDocs.js";
import { squiggleAiLibraries } from "@/collections/squiggleAiLibraries.js";

// Config for https://www.content-collections.dev/.

export default defineConfig({
  collections: [docs, meta, apiDocs, rawApiDocs, squiggleAiLibraries],
});
