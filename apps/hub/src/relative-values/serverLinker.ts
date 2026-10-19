import "server-only";

import { loadModelCard } from "@/models/data/cards";

import { makeRelativeValuesHubLinker } from "./linker";

// Loads imports directly from the database, with the current user's read
// permissions.
export const relativeValuesServerLinker = makeRelativeValuesHubLinker(
  async (owner, slug) => {
    const model = await loadModelCard({ owner, slug });
    const code = model?.currentRevision.squiggleSnippet?.code;
    if (code === undefined) {
      throw new Error(`Model not found: ${owner}/${slug}`);
    }
    return code;
  }
);
