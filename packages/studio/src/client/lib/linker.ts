import { type SqLinker, SqModule } from "@quri/squiggle-lang";

import { parseHubImport } from "../../shared/api.js";
import { dirname, joinPath } from "../../shared/paths.js";
import { api } from "./api.js";

// Linker for Studio projects. Source ids are root-relative file paths
// ("models/main.squiggle") or Hub ids ("hub:owner/slug").
//
// - `import "./other.squiggle" as other` resolves relative to the importing file.
// - `import "hub:owner/slug" as x` is fetched through the server's Hub proxy.
//
// `onLoad` is called with every source id that gets loaded, so that callers can
// track dependencies (e.g. to re-run when an imported file changes on disk).
//
// Invalid imports make `resolve` throw; squiggle-lang reports that as an import
// error at the import statement.
//
// The CLI (`squiggle-studio run`, src/server/linker.ts) applies the same rules
// in Node; test/linker.test.ts checks that both resolve every case alike.

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

export function makeStudioLinker(
  onLoad?: (sourceId: string) => void
): SqLinker {
  return {
    resolve: resolveStudioImport,
    async loadModule(sourceId, hash) {
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
