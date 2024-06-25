import { UnresolvedModule } from "./SqProject2/UnresolvedModule.js";

export type SqLinker = {
  resolve: (name: string, fromId: string) => string;
  loadSource: (sourceId: string) => Promise<string>;
  loadModule: (
    sourceId: string,
    hash: string | undefined
  ) => Promise<UnresolvedModule>;
};
