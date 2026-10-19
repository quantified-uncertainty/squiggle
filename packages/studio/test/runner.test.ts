import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { type HubStub, startHubStub } from "../e2e/lib/hubStub.js";
import {
  contentHash,
  resolveRunTarget,
  RunTimeoutError,
  runStudioFile,
  studioEnvironment,
  studioRunInfo,
  StudioUsageError,
} from "../src/server/runner.js";

// The Node runner behind `squiggle-studio run`, `rv` and `render`'s checks
// (spec §6.4), on a copy of the e2e fixtures with the Hub stub.

const FIXTURES = path.join(import.meta.dirname, "..", "e2e", "fixtures");

let tmp: string;
let root: string;
let hub: HubStub;

beforeAll(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "studio-runner-"));
  root = path.join(tmp, "fixtures");
  await fs.cp(FIXTURES, root, { recursive: true });
  await fs.mkdir(path.join(root, "tree", ".hidden"), { recursive: true });
  await fs.writeFile(path.join(root, "tree", ".hidden", "x.squiggle"), "x = 1");
  hub = await startHubStub();
});

afterAll(async () => {
  await hub?.close();
  await fs.rm(tmp, { recursive: true, force: true });
});

const run = (p: string, opts: { timeoutMs?: number } = {}) =>
  runStudioFile({ root, path: p, hubUrl: hub.url, ...opts });

describe("runStudioFile", () => {
  test("values, with the UI's environment and seed", async () => {
    const result = await run("values/numbers.squiggle");
    expect(result.json.ok).toBe(true);
    expect(result.json.bindings["plain"]).toBe(42);
    expect(result.environment).toEqual({
      sampleCount: 1000,
      xyPointLength: 1000,
      seed: "default-seed",
    });
    // Same seed, same numbers.
    const again = await run("values/numbers.squiggle");
    expect(again.json.bindings).toEqual(result.json.bindings);
  });

  test("../../ imports resolve relative to the importing file", async () => {
    const result = await run("imports/deep/a/b/uses-parent.squiggle");
    expect(result.json.ok).toBe(true);
    expect(result.imports).toEqual([
      "imports/deep/shared.squiggle",
      "imports/lib/costs.squiggle",
    ]);
    expect([...result.sources.keys()]).toContain(
      "imports/deep/shared.squiggle"
    );
  });

  test("an import may not leave the root", async () => {
    const result = await runStudioFile({
      root: path.join(root, "imports", "deep"),
      path: "a/b/uses-parent.squiggle",
      hubUrl: hub.url,
    });
    expect(result.json.ok).toBe(false);
    expect(result.json.errors[0]?.message).toContain(
      "Import path escapes the open folder"
    );
  });

  test("hub: imports go through the Hub client", async () => {
    const result = await run("hub/uses-hub.squiggle");
    expect(result.json.ok).toBe(true);
    expect(result.imports).toEqual(["hub:quri/exports-example"]);
    expect(hub.requests).toContain("quri/exports-example");
  });

  test("errors use root-relative locations and import chains", async () => {
    const parse = await run("errors/parse-error.squiggle");
    expect(parse.json.errors[0]).toMatchObject({
      kind: "compile",
      location: { file: "errors/parse-error.squiggle" },
    });

    const chain = await run("errors/import-chain.squiggle");
    expect(chain.json.errors[0]).toMatchObject({
      kind: "runtime",
      location: { file: "errors/chain/bottom.squiggle" },
      importChain: [
        "errors/chain/bottom.squiggle",
        "errors/chain/middle.squiggle",
      ],
    });

    const missing = await run("errors/missing-import.squiggle");
    expect(missing.json.errors[0]).toMatchObject({
      kind: "other",
      message: expect.stringContaining(
        "File not found: errors/does-not-exist.squiggle"
      ),
      location: { file: "errors/missing-import.squiggle", start: { line: 3 } },
    });
  });

  test("a hidden import is refused like in the UI", async () => {
    const result = await runStudioFile({
      root,
      path: "main.squiggle",
      code: 'import "./tree/.hidden/x.squiggle" as x\ny = x',
      hubUrl: hub.url,
    });
    expect(result.json.errors[0]?.message).toContain("Hidden files");
  });

  test("code instead of the file; codeHash is the hash of the code", async () => {
    const result = await runStudioFile({
      root,
      path: "scratch.squiggle",
      code: "a = 2 * 3",
    });
    expect(result.json.bindings).toEqual({ a: 6 });
    expect(result.codeHash).toBe(contentHash("a = 2 * 3"));
    expect(result.codeHash).toMatch(/^[0-9a-f]{32}$/);
  });

  test("--seed and --sample-count", async () => {
    const result = await runStudioFile({
      root,
      path: "x.squiggle",
      code: "d = normal(0, 1)",
      environment: studioEnvironment({ seed: "other", sampleCount: 50 }),
    });
    expect(result.json.bindings["d"]).toMatchObject({ sampleCount: 50 });
    expect(result.environment).toMatchObject({
      seed: "other",
      sampleCount: 50,
      xyPointLength: 50,
    });
  });

  test("a timeout rejects with RunTimeoutError", async () => {
    const started = Date.now();
    await expect(
      runStudioFile({
        root,
        path: "slow.squiggle",
        code: 'import "hub:quri/slow-example" as s\nx = 1',
        hubUrl: hub.url,
        timeoutMs: 200,
      })
    ).rejects.toBeInstanceOf(RunTimeoutError);
    expect(Date.now() - started).toBeLessThan(1500);
  });
});

describe("studioRunInfo", () => {
  test("views, relative values specs and hidden bindings", async () => {
    const rv = await run("rv/two-specs.squiggle");
    const info = studioRunInfo(root, rv);
    expect(info).toMatchObject({
      root,
      file: "rv/two-specs.squiggle",
      views: ["output", "relative-values", "split"],
      hidden: [],
    });
    expect(info.relativeValues.map((r) => [r.name, r.ok])).toEqual([
      ["fruit", true],
      ["veg", true],
    ]);
    expect(info.codeHash).toBe(
      contentHash(await fs.readFile(path.join(root, "rv/two-specs.squiggle")))
    );

    const misc = studioRunInfo(root, await run("values/misc.squiggle"));
    expect(misc.views).toEqual(["output", "split"]);
    expect(misc.hidden).toEqual(["helper", "alsoHidden"]);
  });
});

describe("resolveRunTarget", () => {
  test("root: --root, else the cwd when the file is inside it, else its folder", async () => {
    const file = path.join(root, "imports", "main.squiggle");
    expect(await resolveRunTarget({ file, cwd: root })).toEqual({
      root,
      path: "imports/main.squiggle",
      abs: file,
    });
    const elsewhere = path.join(tmp, "elsewhere");
    await fs.mkdir(elsewhere, { recursive: true });
    expect(await resolveRunTarget({ file, cwd: elsewhere })).toMatchObject({
      root: path.join(root, "imports"),
      path: "main.squiggle",
    });
    expect(
      await resolveRunTarget({
        file: "main.squiggle",
        root: "..",
        cwd: path.join(root, "imports"),
      })
    ).toMatchObject({ root, path: "imports/main.squiggle" });
  });

  test.each([
    ["missing.squiggle", /File not found/],
    ["text/notes.md", /Expected a \.squiggle file/],
    ["tree", /Not a file/],
    ["tree/.hidden/x.squiggle", /hidden/],
  ])("rejects %s", async (file, message) => {
    const error = await resolveRunTarget({ file, cwd: root }).catch(
      (e: unknown) => e
    );
    expect(error).toBeInstanceOf(StudioUsageError);
    expect(String(error)).toMatch(message);
  });

  test("rejects a file outside --root", async () => {
    await expect(
      resolveRunTarget({
        file: path.join(root, "values", "numbers.squiggle"),
        root: path.join(root, "imports"),
      })
    ).rejects.toThrow(/isn't inside the root/);
  });
});
