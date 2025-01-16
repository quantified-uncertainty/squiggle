import { BaseRunner, RunParams, RunResult } from "./BaseRunner.js";

type RunnerPoolThread = {
  runner: BaseRunner;
  job: Promise<RunResult> | undefined;
};

type RunnerPoolParams = {
  makeRunner: () => BaseRunner;
  maxThreads?: number;
};

export class RunnerPool {
  private makeRunner: () => BaseRunner;

  maxThreads: number;

  threads: RunnerPoolThread[] = [];

  constructor(params: RunnerPoolParams) {
    this.makeRunner = params.makeRunner;
    this.maxThreads = params.maxThreads ?? 1;
  }

  async run(params: RunParams): Promise<RunResult> {
    const unusedThread = this.threads.find(
      (thread): thread is RunnerPoolThread & { runner: BaseRunner } =>
        Boolean(thread.runner && !thread.job)
    );
    if (unusedThread) {
      // TODO - try/catch, kill worker if it errors
      unusedThread.job = unusedThread.runner.run(params);
      const result = await unusedThread.job;
      unusedThread.job = undefined;
      return result;
    }

    if (this.threads.length < this.maxThreads) {
      // lazily allocate a new runner
      this.threads.push({ runner: this.makeRunner(), job: undefined });
    } else {
      // or wait for the next job to complete
      await Promise.race(this.threads.map((runner) => runner.job));
    }
    return this.run(params); // let's try again
  }
}

export class PoolRunner extends BaseRunner {
  public pool: RunnerPool;

  constructor(params: RunnerPoolParams) {
    super();
    this.pool = new RunnerPool(params);
  }

  async run(params: RunParams): Promise<RunResult> {
    return await this.pool.run(params);
  }
}
