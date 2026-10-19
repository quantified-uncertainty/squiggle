import { type SqLinker, SqModule } from "@quri/squiggle-lang";

import { parseHubImport } from "../../shared/api.js";
import { api } from "./api.js";
import { dirname, joinPath } from "./paths.js";

// Linker for Studio projects. Source ids are root-relative file paths
// ("models/main.squiggle") or Hub ids ("hub:owner/slug").
//
// - `import "./other.squiggle" as other` resolves relative to the importing file.
// - `import "hub:owner/slug" as x` is fetched through the server's Hub proxy.
//
// `onLoad` is called with every source id that gets loaded, so that callers can
// track dependencies (e.g. to re-run when an imported file changes on disk).
const INVALID_PREFIX = "invalid:";

function invalidImport(reason: string): string {
  return INVALID_PREFIX + reason;
}

export function makeStudioLinker(
  onLoad?: (sourceId: string) => void
): SqLinker {
  return {
    // `resolve` must not throw: squiggle-lang calls it synchronously while
    // building the import graph, where an exception escapes the project's error
    // handling and the run never finishes. Invalid imports resolve to an
    // `invalid:` id instead, and `loadModule` rejects with the reason, which is
    // reported as a normal import error.
    resolve(name, fromId) {
      if (name.startsWith("hub:")) {
        return parseHubImport(name)
          ? name
          : invalidImport(
              `Invalid Hub import "${name}", expected "hub:owner/slug"`
            );
      }
      if (name.startsWith("./") || name.startsWith("../")) {
        try {
          return joinPath(dirname(fromId), name);
        } catch (e) {
          return invalidImport(e instanceof Error ? e.message : String(e));
        }
      }
      return invalidImport(
        `Unsupported import "${name}". Use a relative path ("./other.squiggle") or a Hub id ("hub:owner/slug").`
      );
    },
    async loadModule(sourceId, hash) {
      if (sourceId.startsWith(INVALID_PREFIX)) {
        throw new Error(sourceId.slice(INVALID_PREFIX.length));
      }
      if (hash) {
        throw new Error("Pinned import hashes are not supported in Studio");
      }
      onLoad?.(sourceId);
      const hub = parseHubImport(sourceId);
      const code = hub
        ? (await api.getHubSource(hub.owner, hub.slug)).code
        : (await api.readFile(sourceId)).content;
      return new SqModule({ name: sourceId, code });
    },
  };
}
