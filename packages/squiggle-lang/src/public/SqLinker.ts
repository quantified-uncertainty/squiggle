import { SqModule } from "./SqProject/SqModule.js";

export type SqLinker = {
  /**
   * Resolve the module name in the import statement to its normalized name.
   *
   * Typically, the normalized name is the same as the name in the import.
   *
   * This is useful for resolving relative imports in the local file system; the
   * name in the import statement, e.g. `import "./foo" as foo`, is normalized
   * to the absolute path of the file.
   */
  resolve: (importString: string, fromId: string) => string;

  /**
   * Load a module by its name.
   *
   * If the `hash` is provided, the linker **must** return the module with that
   * hash. Otherwise, the loading will fail.
   */
  loadModule: (sourceId: string, hash?: string) => Promise<SqModule>;
};

export const defaultLinker: SqLinker = {
  resolve: (name) => name,
  loadModule: () => {
    throw new Error("Imports are not implemented");
  },
};

export function makeSelfContainedLinker(
  sources: Record<string, string>
): SqLinker {
  return {
    resolve: (name) => name,
    async loadModule(name, hash) {
      if (hash) {
        throw new Error("Hashes are not supported");
      }
      const code = sources[name];
      if (!code) {
        throw new Error(`Can't find source with id ${name}`);
      }
      return new SqModule({
        name,
        code,
      });
    },
  };
}
