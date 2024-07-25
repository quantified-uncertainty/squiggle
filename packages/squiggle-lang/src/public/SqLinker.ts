import { SqModule } from "./SqProject/SqModule.js";

export type SqLinker = {
  resolve: (name: string, fromId: string) => string;
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
        name: name,
        code,
      });
    },
  };
}
