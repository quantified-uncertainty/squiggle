import { type SqLinker, SqModule } from "@quri/squiggle-lang";

import { parseHubImport } from "../shared/api.js";
import { dirname, joinPath } from "../shared/paths.js";
import { readFile } from "./files.js";
import { DEFAULT_HUB_URL, type HubClient, makeHubClient } from "./hub.js";

// The Node counterpart of the client's makeStudioLinker
// (src/client/lib/linker.ts), for `squiggle-studio run`, `rv` and `render`'s
// checks: the same import rules, so that the CLI computes what the UI shows.
//
// Source ids are root-relative paths ("models/main.squiggle") or Hub ids
// ("hub:owner/slug").
// - `import "./other.squiggle"` and `"../lib/x.squiggle"` resolve relative to
//   the importing file with the shared joinPath, and may not leave the root.
// - Files are read with the server's own readFile, which applies
//   resolveSafePath (no hidden or ignored segments, no symlinks out of the
//   root), so a bad import fails with the message the UI shows.
// - `import "hub:owner/slug"` is fetched from Squiggle Hub (or `hubUrl`).

export type NodeLinker = SqLinker & {
  // The code of every module this linker loaded, by source id. Callers add
  // the root module's code, so the map can be passed to the JSON serializers.
  sources: Map<string, string>;
  // Source ids loaded through the linker, in the order they finished loading.
  loaded: string[];
};

// Same rules as resolveStudioImport in src/client/lib/linker.ts (a test runs
// both over the same cases).
export function resolveStudioImport(name: string, fromId: string): string {
  if (name.startsWith("hub:")) {
    if (!parseHubImport(name)) {
      throw new Error(
        `Invalid Hub import "${name}", expected "hub:owner/slug"`
      );
    }
    return name;
  }
  if (name.startsWith("./") || name.startsWith("../")) {
    return joinPath(dirname(fromId), name);
  }
  throw new Error(
    `Unsupported import "${name}". Use a relative path ("./other.squiggle") or a Hub id ("hub:owner/slug").`
  );
}

export function makeNodeLinker(opts: {
  root: string; // absolute path of the open folder
  hubUrl?: string; // default: Squiggle Hub
  hub?: HubClient; // overrides hubUrl
}): NodeLinker {
  const hub = opts.hub ?? makeHubClient(opts.hubUrl ?? DEFAULT_HUB_URL);
  const sources = new Map<string, string>();
  const loaded: string[] = [];
  return {
    sources,
    loaded,
    resolve: resolveStudioImport,
    async loadModule(sourceId, hash) {
      if (hash) {
        throw new Error("Pinned import hashes are not supported in Studio");
      }
      const hubId = parseHubImport(sourceId);
      const code = hubId
        ? await hub.getSource(hubId.owner, hubId.slug)
        : (await readFile(opts.root, sourceId)).content;
      sources.set(sourceId, code);
      if (!loaded.includes(sourceId)) loaded.push(sourceId);
      return new SqModule({ name: sourceId, code });
    },
  };
}
