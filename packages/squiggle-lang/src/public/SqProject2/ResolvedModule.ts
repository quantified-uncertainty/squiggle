import { UnresolvedModule } from "./UnresolvedModule.js";
import { getHash } from "./utils.js";

export type ResolvedModuleHash = string;

export class ResolvedModule {
  constructor(
    public module: UnresolvedModule,
    public resolutions: Record<string, ResolvedModule> // key is a source id (unresolved.name)
  ) {
    for (const imp of this.module.imports()) {
      if (!this.resolutions[imp.sourceId]) {
        throw new Error(`Missing resolution for ${imp.sourceId}`);
      }
    }
  }

  hash(): ResolvedModuleHash {
    return (
      `resolved-${this.module.name}-` +
      getHash(
        JSON.stringify({
          self: this.module.hash(),
          deps: this.module
            .imports()
            .map((imp) => this.resolutions[imp.sourceId].hash()),
        })
      )
    );
  }
}
