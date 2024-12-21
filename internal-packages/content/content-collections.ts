import { defineConfig } from "@content-collections/core";

import { apiDocs } from "./src/collections/apiDocs.js";
import { docs } from "./src/collections/docs.js";
import { meta } from "./src/collections/meta.js";
import { rawApiDocs } from "./src/collections/rawApiDocs.js";
import { squiggleAiLibraries } from "./src/collections/squiggleAiLibraries.js";

// Config for https://www.content-collections.dev/.

export default defineConfig({
  collections: [docs, meta, apiDocs, rawApiDocs, squiggleAiLibraries],
});
