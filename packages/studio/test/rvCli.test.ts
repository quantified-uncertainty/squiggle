import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { parseRelativeValuesBundle } from "@quri/squiggle-relative-values/core";

import { runRv } from "../src/cli/commands/rv.js";

// `squiggle-studio rv` (spec §6.3), on the committed e2e fixtures. Tests run
// in the fixtures folder, like an agent in its project.

const STUDIO_DIR = path.resolve(import.meta.dirname, "..");
const FIXTURES = path.join(STUDIO_DIR, "e2e", "fixtures");
const cwd = { cwd: FIXTURES };

function json(stdout: string): unknown {
  return JSON.parse(stdout);
}

describe("rv --format json", () => {
  test("prints the bundle of the only spec", async () => {
    const result = await runRv("rv/minimal.squiggle", {}, cwd);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    const output = json(result.stdout);
    expect(output).toMatchObject({ ok: true, version: 1 });
    const bundle = parseRelativeValuesBundle(output);
    if (!bundle.ok) throw new Error(bundle.value);
    expect(bundle.value.definition.items.map((i) => i.id)).toEqual([
      "apple",
      "banana",
      "mango",
    ]);
    expect(bundle.value.pairs).toHaveLength(9);
    expect(bundle.value.meta).toMatchObject({
      variableName: "fruit",
      seed: "default-seed",
      sampleCount: 1000,
      file: "rv/minimal.squiggle",
    });
    expect(bundle.value.meta.sourceHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(bundle.value.meta.generator).toMatch(/^squiggle-studio@/);
  });

  test("several specs without --variable: an array of bundles", async () => {
    const result = await runRv("rv/two-specs.squiggle", {}, cwd);
    expect(result.exitCode).toBe(0);
    const output = json(result.stdout);
    expect(Array.isArray(output)).toBe(true);
    expect(
      (output as Array<{ meta: { variableName: string } }>).map(
        (b) => b.meta.variableName
      )
    ).toEqual(["fruit", "veg"]);
  });

  test("--variable picks one spec", async () => {
    const result = await runRv(
      "rv/two-specs.squiggle",
      { variable: "veg" },
      cwd
    );
    expect(result.exitCode).toBe(0);
    expect(json(result.stdout)).toMatchObject({
      ok: true,
      meta: { variableName: "veg" },
    });
  });

  test("--unit adds the List view", async () => {
    const result = await runRv(
      "rv/clusters.squiggle",
      { unit: "essay", precision: 3 },
      cwd
    );
    expect(result.exitCode).toBe(0);
    const output = json(result.stdout) as {
      list: Array<{ id: string; median?: number; clusterId: string | null }>;
    };
    // Cluster tables in definition order, items in definition order.
    expect(output.list.map((row) => row.id)).toEqual([
      "essay",
      "paper",
      "bigPaper",
      "tool",
      "website",
      "library",
    ]);
    expect(output.list[0]).toMatchObject({
      id: "essay",
      name: "Short essay",
      clusterId: "writing",
      median: 1,
      uncertainty: 0,
    });
  });

  test("an invalid spec: ok false with the UI's message, exit 1", async () => {
    const result = await runRv("rv/invalid-spec.squiggle", {}, cwd);
    expect(result.exitCode).toBe(1);
    expect(json(result.stdout)).toEqual({
      ok: false,
      variable: "fruit",
      error: "values.kiwi must be a distribution or a number, got String",
    });
  });

  test("failed comparisons are error pairs, exit 0", async () => {
    const result = await runRv("rv/error-cells.squiggle", {}, cwd);
    expect(result.exitCode).toBe(0);
    const output = json(result.stdout) as {
      pairs: Array<[string, string, { error?: string }]>;
    };
    const broken = output.pairs.find(
      ([a, b]) => a === "broken" && b === "alpha"
    );
    expect(broken?.[2].error).toMatch(/No estimate for broken/);
  });

  test("imports resolve relative to the file, inside the root", async () => {
    const result = await runRv("rv/with-imports.squiggle", {}, cwd);
    expect(result.exitCode).toBe(0);
    expect(json(result.stdout)).toMatchObject({
      ok: true,
      meta: { variableName: "projects" },
    });
  });

  test("a failing model reports its errors, exit 1", async () => {
    const result = await runRv("errors/runtime-error.squiggle", {}, cwd);
    expect(result.exitCode).toBe(1);
    const output = json(result.stdout) as {
      ok: boolean;
      errors: Array<{ kind: string; message: string }>;
    };
    expect(output.ok).toBe(false);
    expect(output.errors.length).toBeGreaterThan(0);
  });

  test("a file without specs: exit 1", async () => {
    const result = await runRv("values/numbers.squiggle", {}, cwd);
    expect(result.exitCode).toBe(1);
    expect(json(result.stdout)).toEqual({
      ok: false,
      error: "No relative values specs found in values/numbers.squiggle",
    });
  });
});

describe("rv --format csv", () => {
  test("wide matrix of medians", async () => {
    const result = await runRv(
      "rv/minimal.squiggle",
      { format: "csv", precision: 3 },
      cwd
    );
    expect(result.exitCode).toBe(0);
    const lines = result.stdout.trimEnd().split("\n");
    expect(lines[0]).toBe(",apple,banana,mango");
    expect(lines).toHaveLength(4);
    expect(lines[1]).toMatch(/^apple,1,/);
  });

  test("--metric, --long and ERR cells", async () => {
    const wide = await runRv(
      "rv/error-cells.squiggle",
      { format: "csv", metric: "uncertainty" },
      cwd
    );
    expect(wide.exitCode).toBe(0);
    expect(wide.stdout.split("\n")[4]).toBe("broken,ERR,ERR,ERR,ERR");

    const long = await runRv(
      "rv/error-cells.squiggle",
      { format: "csv", long: true },
      cwd
    );
    const lines = long.stdout.trimEnd().split("\n");
    expect(lines[0]).toBe("row,col,median,mean,min,max,uncertainty,error");
    expect(lines).toHaveLength(1 + 16);
  });

  test("--unit prints the List view", async () => {
    const result = await runRv(
      "rv/minimal.squiggle",
      { format: "csv", unit: "banana", precision: 3 },
      cwd
    );
    const lines = result.stdout.trimEnd().split("\n");
    expect(lines[0]).toBe(
      "id,name,cluster,median,mean,min,max,uncertainty,error"
    );
    expect(lines[2]).toBe("banana,banana,,1,1,1,1,0,");
  });

  test("several specs without --variable: exit 2, listing the names", async () => {
    const result = await runRv("rv/two-specs.squiggle", { format: "csv" }, cwd);
    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toMatch(
      /several relative values specs \(fruit, veg\)/
    );
  });

  test("an invalid spec: exit 1 with the message on stderr", async () => {
    const result = await runRv(
      "rv/invalid-spec.squiggle",
      { format: "csv" },
      cwd
    );
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(
      /values\.kiwi must be a distribution or a number, got String/
    );
  });
});

describe("usage errors exit 2", () => {
  test.each([
    ["missing file", "rv/nope.squiggle", {}, /No such file/],
    ["not .squiggle", "text/notes.md", {}, /Not a \.squiggle file/],
    ["a directory", "rv", {}, /Not a file/],
    ["bad --format", "rv/minimal.squiggle", { format: "xml" }, /--format/],
    ["bad --metric", "rv/minimal.squiggle", { metric: "p50" }, /--metric/],
    [
      "bad --precision",
      "rv/minimal.squiggle",
      { precision: "0" },
      /--precision/,
    ],
    [
      "unknown --unit",
      "rv/minimal.squiggle",
      { unit: "kiwi" },
      /No item "kiwi"/,
    ],
    [
      "unknown --variable",
      "rv/minimal.squiggle",
      { variable: "veg" },
      /No variable named "veg"/,
    ],
  ])("%s", async (_name, file, options, message) => {
    const result = await runRv(file, options, cwd);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(message);
  });

  test("hidden files are refused", async () => {
    const result = await runRv(
      "tree/.hidden/secret.squiggle",
      {},
      { cwd: tmp }
    );
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/Hidden files/);
  });

  test("a file outside --root", async () => {
    const result = await runRv(
      "rv/minimal.squiggle",
      { root: path.join(FIXTURES, "values") },
      cwd
    );
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/outside the root folder/);
  });
});

describe("--root", () => {
  test("defaults to the cwd, so an import may go up from the file", async () => {
    const result = await runRv(
      "with-imports.squiggle",
      {},
      { cwd: path.join(FIXTURES, "rv") }
    );
    expect(result.exitCode).toBe(0);

    const lib = path.join(tmp, "lib");
    await fs.mkdir(lib, { recursive: true });
    await fs.writeFile(
      path.join(lib, "up.squiggle"),
      'import "../costs.squiggle" as c\nspec = { values: { a: 1, b: c.x } }\n'
    );
    await fs.writeFile(path.join(tmp, "costs.squiggle"), "export x = 2\n");
    // Rooted at lib/ (the cwd), the import escapes the root, as in the UI.
    const escaped = await runRv("up.squiggle", {}, { cwd: lib });
    expect(escaped.exitCode).toBe(1);
    expect(escaped.stdout).toMatch(/escapes the open folder/);
    // Rooted above it (the cwd, or --root), it resolves.
    expect((await runRv("lib/up.squiggle", {}, { cwd: tmp })).exitCode).toBe(0);
    expect(
      (await runRv("up.squiggle", { root: tmp }, { cwd: lib })).exitCode
    ).toBe(0);
  });
});

let tmp: string;
beforeAll(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "studio-rv-cli-"));
  await fs.mkdir(path.join(tmp, "tree", ".hidden"), { recursive: true });
  await fs.writeFile(
    path.join(tmp, "tree", ".hidden", "secret.squiggle"),
    "spec = { values: { a: 1, b: 2 } }\n"
  );
});
afterAll(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe("the command line", () => {
  // One process run for the commander wiring and exit codes.
  test("squiggle-studio rv … --format csv", () => {
    const tsx = path.join(STUDIO_DIR, "node_modules", ".bin", "tsx");
    const cli = path.join(STUDIO_DIR, "src", "cli", "index.ts");
    const ok = spawnSync(
      tsx,
      [cli, "rv", "rv/minimal.squiggle", "--format", "csv", "--metric", "mean"],
      { cwd: FIXTURES, encoding: "utf-8" }
    );
    expect(ok.status).toBe(0);
    expect(ok.stdout.split("\n")[0]).toBe(",apple,banana,mango");

    const usage = spawnSync(
      tsx,
      [cli, "rv", "rv/two-specs.squiggle", "--format", "csv"],
      { cwd: FIXTURES, encoding: "utf-8" }
    );
    expect(usage.status).toBe(2);
    expect(usage.stderr).toMatch(/pick one with --variable/);
  }, 30_000);
});
