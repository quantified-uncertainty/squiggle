import { BaseRunner, RunParams, RunResult } from "./BaseRunner.js";

export class WithCacheLoaderRunner extends BaseRunner {
  constructor(
    public wrappedRunner: BaseRunner,
    // This function should be able to return `undefined`, so unfortunately it can't be represented as a runner.
    // Maybe it makes sense to add a separate `CacheLoader` class hierarchy.
    public loadCache: (params: RunParams) => Promise<RunResult | undefined>
  ) {
    super();
  }

  async run(params: RunParams): Promise<RunResult> {
    const fromCache = await this.loadCache(params);
    return fromCache ?? (await this.wrappedRunner.run(params));
  }
}
