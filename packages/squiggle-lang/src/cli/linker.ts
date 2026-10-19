import fs from "fs/promises";
import path from "path";

import { SqLinker } from "../public/SqLinker.js";
import { SqModule } from "../public/SqProject/SqModule.js";

export const EVAL_SOURCE_ID = "[eval]";

export type FileLinker = SqLinker & {
  // Source code of every module loaded through this linker, keyed by source id (path relative to cwd).
  sources: Map<string, string>;
};

// Linker that resolves relative imports from the filesystem.
export function makeFileLinker(): FileLinker {
  const sources = new Map<string, string>();
  return {
    sources,
    resolve(name, fromId) {
      if (!name.startsWith("./") && !name.startsWith("../")) {
        throw new Error(
          `Only relative paths in imports are allowed, got "${name}"`
        );
      }
      const dir =
        fromId === EVAL_SOURCE_ID ? process.cwd() : path.dirname(fromId);
      return path.relative(process.cwd(), path.resolve(dir, name));
    },
    async loadModule(sourceId, hash) {
      if (hash) {
        throw new Error("Hashes are not supported in CLI imports");
      }
      let code: string;
      try {
        code = await fs.readFile(sourceId, "utf-8");
      } catch (e) {
        throw new Error(
          `Failed to read import "${sourceId}": ${e instanceof Error ? e.message : String(e)}`
        );
      }
      sources.set(sourceId, code);
      return new SqModule({ name: sourceId, code });
    },
  };
}
