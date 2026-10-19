import { jest } from "@jest/globals";
import fs from "fs";
import os from "os";
import path from "path";

import { watch } from "../../src/cli/commands/run.js";
import { makeFileWatcher, makeRerunScheduler } from "../../src/cli/watch.js";
import { SqProject } from "../../src/public/SqProject/index.js";

function deferred() {
  let resolve: () => void = () => undefined; // replaced by the executor below
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

async function flushPromises() {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

async function waitFor(condition: () => boolean, timeoutMs: number) {
  const started = Date.now();
  while (!condition()) {
    if (Date.now() - started > timeoutMs) {
      throw new Error("Timed out");
    }
    await sleep(20);
  }
}

describe("makeRerunScheduler", () => {
  // Each call of the task returns a promise that the test resolves manually.
  let runs: ReturnType<typeof deferred>[];
  let scheduler: ReturnType<typeof makeRerunScheduler>;

  beforeEach(() => {
    jest.useFakeTimers();
    runs = [];
    scheduler = makeRerunScheduler(() => {
      const run = deferred();
      runs.push(run);
      return run.promise;
    }, 100);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("debounces triggers", async () => {
    scheduler.trigger();
    await jest.advanceTimersByTimeAsync(50);
    scheduler.trigger();
    await jest.advanceTimersByTimeAsync(99);
    expect(runs).toHaveLength(0);
    await jest.advanceTimersByTimeAsync(1);
    expect(runs).toHaveLength(1);
  });

  test("triggers during a run cause one more run after it", async () => {
    void scheduler.run();
    expect(runs).toHaveLength(1);

    scheduler.trigger();
    await jest.advanceTimersByTimeAsync(100);
    scheduler.trigger();
    await jest.advanceTimersByTimeAsync(100);
    expect(runs).toHaveLength(1); // still running

    runs[0].resolve();
    await flushPromises();
    expect(runs).toHaveLength(2);

    runs[1].resolve();
    await flushPromises();
    await jest.advanceTimersByTimeAsync(1000);
    expect(runs).toHaveLength(2);
  });

  test("a trigger that is still debouncing when the run ends starts the next run", async () => {
    void scheduler.run();
    scheduler.trigger();
    await jest.advanceTimersByTimeAsync(100); // marks the run as pending
    scheduler.trigger();
    await jest.advanceTimersByTimeAsync(50);

    runs[0].resolve();
    await flushPromises();
    expect(runs).toHaveLength(1); // waits for the debounce

    await jest.advanceTimersByTimeAsync(50);
    expect(runs).toHaveLength(2);
    runs[1].resolve();
    await flushPromises();
    await jest.advanceTimersByTimeAsync(1000);
    expect(runs).toHaveLength(2);
  });

  test("cancel", async () => {
    scheduler.trigger();
    scheduler.cancel();
    await jest.advanceTimersByTimeAsync(1000);
    expect(runs).toHaveLength(0);
  });
});

describe("watch", () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "squiggle-watch-"));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test("file watcher notices atomic saves", async () => {
    const file = path.join(dir, "main.squiggle");
    fs.writeFileSync(file, "1");
    let changes = 0;
    const watcher = makeFileWatcher(() => changes++);
    watcher.setFiles([file]);
    await sleep(200); // some platforms miss events right after the watcher starts
    try {
      for (const code of ["2", "3"]) {
        const before = changes;
        const tmp = path.join(dir, `.main.squiggle.${code}.tmp`);
        fs.writeFileSync(tmp, code);
        fs.renameSync(tmp, file);
        await waitFor(() => changes > before, 5000);
      }
    } finally {
      watcher.close();
    }
  });

  test("reruns when the file changes during a run", async () => {
    const file = path.join(dir, "main.squiggle");
    fs.writeFileSync(file, "1");

    const outputs: string[] = [];
    jest.spyOn(console, "log").mockImplementation((text: string) => {
      outputs.push(text);
    });

    // Make the first run slow, and edit the file while it's running.
    const originalWaitForOutput = SqProject.prototype.waitForOutput;
    let calls = 0;
    jest
      .spyOn(SqProject.prototype, "waitForOutput")
      .mockImplementation(async function (this: SqProject, headName: string) {
        const output = await originalWaitForOutput.call(this, headName);
        calls++;
        if (calls === 1) {
          await sleep(200); // some platforms miss events right after the watcher starts
          fs.writeFileSync(file, "2");
          await sleep(500); // the change is noticed and debounced while still running
        }
        return output;
      });

    const handle = await watch(
      { src: "1", filename: file, output: "JSON" },
      file
    );
    try {
      await waitFor(() => outputs.length >= 2, 5000);
      expect(outputs.map((text) => JSON.parse(text).result)).toEqual([1, 2]);
    } finally {
      handle.close();
    }
  }, 10000);
});
