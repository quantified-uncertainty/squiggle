import { UnresolvedModule } from "./SqProject/UnresolvedModule.js";

export type SqLinker = {
  resolve: (name: string, fromId: string) => string;
  loadModule: (sourceId: string, hash?: string) => Promise<UnresolvedModule>;
};

export const defaultLinker: SqLinker = {
  resolve: () => {
    throw new Error("Imports are not implemented");
  },
  loadModule: () => {
    throw new Error("Imports are not implemented");
  },
};

export function makeSelfContainedLinker(
  sources: Record<string, string>
): SqLinker {
  const linker: SqLinker = {
    resolve: (name) => name,
    async loadModule(sourceId, hash) {
      if (hash) {
        throw new Error("Hashes are not supported");
      }
      const code = sources[sourceId];
      if (!code) {
        throw new Error(`Can't find source with id ${sourceId}`);
      }
      return new UnresolvedModule({
        name: sourceId,
        code,
        linker,
      });
    },
  };
  return linker;
}
