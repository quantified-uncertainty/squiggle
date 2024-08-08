import NodeWorker from "web-worker";

import { AnyWorkerRunner } from "./AnyWorkerRunner.js";

/**
 * This module is bad for webpack environments.
 *
 * Webpack (e.g. Next.js) tries to load it, gets to `import(varName)` statement
 * in web-worker internals, and fails with "Critical dependency: the request of
 * a dependency is an expression".
 *
 * This will happen even if you try to load this module conditionally.
 *
 * It's probably possible to fix it with more webpack configuration, but that
 * would create extra burden on all squiggle-lang users who need to use it with
 * webpack.
 *
 * Because of this, we should never import this module in `src/index.js` (or
 * anywhere else except tests or `src/cli/`). We provide a separate entrypoint
 * in `package.json` instead.
 *
 * Unfortunately, this also means that this runner is not addressable by name in
 * `runnerByName`; you have to import it explicitly, create `new
 * NodeWorkerRunner()`, and then pass it to `SqProject`.
 **/

function isNodeJs() {
  return Boolean(
    typeof process === "object" &&
      typeof process.versions === "object" &&
      process.versions.node
  );
}

type Worker = (typeof global)["Worker"]["prototype"];

export class NodeWorkerRunner extends AnyWorkerRunner {
  worker: Worker;

  constructor() {
    // This runner is Node.js-specific. In theory,
    // https://www.npmjs.com/package/web-worker is universal, but it doesn't
    // play well with webpack.
    if (!isNodeJs()) {
      throw new Error("NodeWorkerRunner is only available in Node.js");
    }

    super();

    // web-worker module types are broken, so we use browser types instead
    const workerUrl = new URL("./worker.js", import.meta.url);
    this.worker = new (NodeWorker as any)(workerUrl, {
      type: "module",
    }) as Worker;
  }

  async getWorker(): Promise<Worker> {
    return this.worker;
  }
}
