import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { type HubStub, startHubStub } from "../e2e/lib/hubStub.js";
import { freePort } from "../e2e/lib/ports.js";
import { renderViewState } from "../src/cli/commands/render.js";
import { formatRunText } from "../src/cli/commands/run.js";
import { resolveServeTarget, serveUrl } from "../src/cli/commands/serve.js";
import { parseDuration, parseWidth } from "../src/cli/args.js";
import { runStudioFile } from "../src/server/runner.js";

// The CLI entry and commands (spec §6.3; QA #25, #47, #50), run as a child
// process (`tsx src/cli/index.ts`) with an isolated HOME. None of these need
// Chrome: render's validation runs before it starts (--chrome points nowhere,
// so a test that got past validation fails with exit 1, not 2).

const STUDIO_DIR = path.resolve(import.meta.dirname, "..");
const CLI = path.join(STUDIO_DIR, "src", "cli", "index.ts");
const TSX = createRequire(import.meta.url).resolve("tsx/cli");
const FIXTURES = path.join(STUDIO_DIR, "e2e", "fixtures");
const PKG_VERSION = (
  JSON.parse(
    await fs.readFile(path.join(STUDIO_DIR, "package.json"), "utf-8")
  ) as { version: string }
).version;

let tmp: string;
let home: string;
let root: string;
let hub: HubStub;

beforeAll(async () => {
  // realpath: the child's process.cwd() is resolved (/private/var on macOS).
  tmp = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "studio-cli-"))
  );
  home = path.join(tmp, "home");
  root = path.join(tmp, "models");
  await fs.mkdir(home);
  await fs.cp(FIXTURES, root, { recursive: true });
  await fs.writeFile(path.join(root, ".hidden.squiggle"), "x = 1");
  hub = await startHubStub();
});

afterAll(async () => {
  await hub?.close();
  await fs.rm(tmp, { recursive: true, force: true });
});

type Result = {
  code: number | null;
  stdout: string;
  stderr: string;
  ms: number;
};

function cli(
  args: string[],
  opts: { cwd?: string; env?: Record<string, string>; until?: RegExp } = {}
): Promise<Result> {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [TSX, CLI, ...args], {
      cwd: opts.cwd ?? root,
      env: {
        ...process.env,
        HOME: home,
        USERPROFILE: home,
        SQUIGGLE_HUB_URL: hub.url,
        ...opts.env,
      },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d: Buffer) => {
      stdout += d.toString();
      // Long-running commands (serve): stop once the output appeared.
      if (opts.until?.test(stdout)) child.kill("SIGTERM");
    });
    child.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) =>
      resolve({ code, stdout, stderr, ms: Date.now() - started })
    );
  });
}

describe("entry (#50)", () => {
  test("--version and -V", async () => {
    for (const flag of ["--version", "-V"]) {
      const r = await cli([flag]);
      expect(r.code).toBe(0);
      expect(r.stdout.trim()).toBe(PKG_VERSION);
    }
  });

  test("help, help render and help run", async () => {
    const help = await cli(["help"]);
    expect(help.code).toBe(0);
    expect(help.stdout).toMatch(/^Usage: squiggle-studio/);
    expect(help.stdout).toMatch(/render \[options\]/);
    expect(help.stdout).toMatch(/run \[options\] <file>/);

    const render = await cli(["help", "render"]);
    expect(render.code).toBe(0);
    expect(render.stdout).toMatch(/^Usage: squiggle-studio render/);
    for (const flag of [
      "--root",
      "--json",
      "--scale",
      "--layout",
      "--url",
      "--timeout",
    ]) {
      expect(render.stdout).toContain(flag);
    }

    const run = await cli(["help", "run"]);
    expect(run.stdout).toMatch(/Exit codes: 0 ok, 1 model error, 2 usage/);
  });

  test("a file argument opens its folder with the file shown", async () => {
    expect(resolveServeTarget("values/numbers.squiggle", root)).toEqual({
      root: path.join(root, "values"),
      file: "numbers.squiggle",
    });
    expect(resolveServeTarget("values", root)).toEqual({
      root: path.join(root, "values"),
    });
    expect(() => resolveServeTarget("nope", root)).toThrow(/No such file/);
    expect(
      serveUrl("http://127.0.0.1:4321", { root, file: "a b.squiggle" })
    ).toBe("http://127.0.0.1:4321/?file=a+b.squiggle");
    expect(serveUrl("http://127.0.0.1:4321", { root })).toBe(
      "http://127.0.0.1:4321"
    );

    const port = await freePort();
    const r = await cli(
      ["values/numbers.squiggle", "--no-open", "--port", String(port)],
      { until: /Serving .*\n/ }
    );
    expect(r.stdout).toContain(
      `Squiggle Studio is running at http://127.0.0.1:${port}/?file=numbers.squiggle`
    );
    expect(r.stdout).toContain(`Serving ${path.join(root, "values")}`);
  });

  test("usage errors exit with 2", async () => {
    const r = await cli(["--no-such-flag"]);
    expect(r.code).toBe(2);
    expect(r.stderr).toContain("unknown option");
    expect((await cli(["no-such-folder", "--no-open"])).code).toBe(2);
  });
});

describe("run", () => {
  test("text output: one line per visible binding with @format", async () => {
    const r = await cli(["run", "values/numbers.squiggle"]);
    expect(r.code).toBe(0);
    expect(r.stdout).toMatch(/^price\s+Price \(\$\)\s+\$1,234\.57$/m);
    expect(r.stdout).toMatch(/^share\s+Share\s+42\.3%$/m);
    expect(r.stdout).toMatch(
      /^uncertainCost\s+Uncertain cost \(\$\)\s+mean \$[\d,]+\s+p5–p95 \$[\d,]+–\$[\d,]+$/m
    );
  });

  test("--json: RunJson plus the studio block", async () => {
    const r = await cli(["run", "imports/main.squiggle", "--json"]);
    expect(r.code).toBe(0);
    const json = JSON.parse(r.stdout) as Record<string, unknown>;
    expect(json).toMatchObject({
      ok: true,
      errors: [],
      studio: {
        root,
        file: "imports/main.squiggle",
        codeHash: expect.stringMatching(/^[0-9a-f]{32}$/),
        environment: {
          sampleCount: 1000,
          xyPointLength: 1000,
          seed: "default-seed",
        },
        imports: ["imports/lib/costs.squiggle"],
        warnings: [],
        views: ["output", "split"],
        relativeValues: [],
        hidden: [],
      },
    });
    expect(Object.keys(json["bindings"] as object)).toEqual([
      "weeks",
      "totalCost",
    ]);
  });

  test("--only keeps the named bindings and dotted paths", async () => {
    const r = await cli([
      "run",
      "values/collections.squiggle",
      "--json",
      "--only",
      "config,nested.flags.version",
    ]);
    expect(r.code).toBe(0);
    const json = JSON.parse(r.stdout) as { bindings: Record<string, unknown> };
    expect(json.bindings).toMatchObject({
      config: { rate: 0.05, years: 10, label: "base case" },
      "nested.flags.version": 2,
    });
    expect(Object.keys(json.bindings)).toHaveLength(2);

    const text = await cli([
      "run",
      "values/numbers.squiggle",
      "--only",
      "price",
    ]);
    expect(text.stdout.trim().split("\n")).toHaveLength(1);

    const missing = await cli([
      "run",
      "values/numbers.squiggle",
      "--only",
      "nope",
    ]);
    expect(missing.code).toBe(2);
    expect(missing.stderr).toMatch(/no binding "nope".*Bindings: plain, price/);
  });

  test("a hub: import, through SQUIGGLE_HUB_URL", async () => {
    const r = await cli(["run", "hub/uses-hub.squiggle", "--json"]);
    expect(r.code).toBe(0);
    expect(JSON.parse(r.stdout)).toMatchObject({
      ok: true,
      studio: { imports: ["hub:quri/exports-example"] },
    });
  });

  test("../ imports from the root; --root", async () => {
    const r = await cli(
      ["run", "deep/a/b/uses-parent.squiggle", "--root", "."],
      {
        cwd: path.join(root, "imports"),
      }
    );
    expect(r.code).toBe(0);
    expect(r.stdout).toMatch(/^scaledCost/m);

    // From inside deep/, ../../../lib escapes the root.
    const escaped = await cli(["run", "a/b/uses-parent.squiggle"], {
      cwd: path.join(root, "imports", "deep"),
    });
    expect(escaped.code).toBe(1);
    expect(escaped.stdout).toContain("escapes the open folder");
  });

  test("exit 1 on model errors, with file:line:col", async () => {
    const r = await cli(["run", "errors/runtime-error.squiggle"]);
    expect(r.code).toBe(1);
    expect(r.stdout).toMatch(
      /^errors\/runtime-error\.squiggle:\d+:\d+ runtime: /m
    );

    const json = await cli(["run", "errors/import-chain.squiggle", "--json"]);
    expect(json.code).toBe(1);
    expect(JSON.parse(json.stdout)).toMatchObject({
      ok: false,
      errors: [{ kind: "runtime", importChain: expect.any(Array) }],
    });
  });

  test.each([
    [["run", "text/notes.md"], /Expected a \.squiggle file/],
    [["run", "values"], /Not a file/],
    [["run", ".hidden.squiggle"], /hidden/],
    [["run", "missing.squiggle"], /File not found/],
    [
      ["run", "values/numbers.squiggle", "--root", "imports"],
      /isn't inside the root/,
    ],
    [["run", "values/numbers.squiggle", "--timeout", "soon"], /duration/],
    [["run", "values/numbers.squiggle", "-n", "0"], /positive integer/],
  ])("usage error %j exits with 2", async (args, message) => {
    const r = await cli(args);
    expect(r.code).toBe(2);
    expect(r.stderr).toMatch(message);
  });

  test("a timeout exits with 124", async () => {
    await fs.writeFile(
      path.join(root, "slow.squiggle"),
      'import "hub:quri/slow-example" as s\nx = 1'
    );
    const r = await cli([
      "run",
      "slow.squiggle",
      "--json",
      "--timeout",
      "300ms",
    ]);
    expect(r.code).toBe(124);
    expect(JSON.parse(r.stdout)).toMatchObject({
      ok: false,
      errors: [
        { kind: "other", message: expect.stringContaining("didn't finish") },
      ],
    });
  });
});

describe("render validation, before Chrome starts (#25, #47)", () => {
  const nowhere = path.join(os.tmpdir(), "no-such-chrome");
  test.each([
    [["text/notes.md"], /Expected a \.squiggle file/],
    [["values"], /Not a file/],
    [[".hidden.squiggle"], /hidden/],
    [
      ["values/numbers.squiggle", "--view", "split"],
      /Allowed choices are output, relative-values/,
    ],
    [["values/numbers.squiggle", "--view", "bogus"], /Allowed choices/],
    [
      ["rv/minimal.squiggle", "--tab", "bogus"],
      /Allowed choices are list, grid, plot/,
    ],
    [["values/numbers.squiggle", "--width", "abc"], /Width must be/],
    [["values/numbers.squiggle", "--width", "0"], /Width must be/],
    [["values/numbers.squiggle", "--scale", "3"], /Allowed choices are 1, 2/],
    [
      ["values/numbers.squiggle", "--view", "output", "--tab", "grid"],
      /--tab applies/,
    ],
    [["--url", "http://127.0.0.1:4321/?view=output"], /no \?file=/],
    [[], /Give a \.squiggle file/],
  ])("render %j fails fast with exit 2", async (args, message) => {
    const r = await cli(["render", ...args, "--chrome", nowhere]);
    expect(r.code).toBe(2);
    expect(r.stderr).toMatch(message);
    expect(r.ms).toBeLessThan(5_000);
  });
});

describe("helpers", () => {
  test("parseWidth and parseDuration", () => {
    expect(parseWidth("200")).toBe(200);
    expect(parseWidth("8000")).toBe(8000);
    expect(() => parseWidth("8001")).toThrow(/Width/);
    expect(() => parseWidth("1e3")).toThrow(/Width/);
    expect(parseDuration("30s")).toBe(30_000);
    expect(parseDuration("2m")).toBe(120_000);
    expect(parseDuration("500ms")).toBe(500);
    expect(parseDuration("5")).toBe(5_000);
    expect(parseDuration("0")).toBe(0);
  });

  test("render view state: --url, then flags", () => {
    const url =
      "http://127.0.0.1:4321/?file=models%2Ffruit.squiggle&view=relative-values&tab=grid&variable=fruit&test=1";
    expect(renderViewState(undefined, { url })).toEqual({
      file: "models/fruit.squiggle",
      view: "relative-values",
      tab: "grid",
      variable: "fruit",
    });
    expect(renderViewState(undefined, { url, tab: "plot" })).toMatchObject({
      tab: "plot",
    });
    // A tab implies the relative values view.
    expect(renderViewState("a.squiggle", { tab: "list" })).toEqual({
      file: "a.squiggle",
      view: "relative-values",
      tab: "list",
    });
    expect(renderViewState("a.squiggle", {})).toEqual({
      file: "a.squiggle",
      view: "output",
    });
    expect(() =>
      renderViewState(undefined, {
        url: "http://127.0.0.1:4321/?file=a.squiggle&view=split",
      })
    ).toThrow(/"split" view/);
  });

  test("formatRunText lists the result and hides @hide bindings", async () => {
    const run = await runStudioFile({
      root,
      path: "x.squiggle",
      code: '@hide\nsecret = 1\n@name("Shown")\nshown = 2\nshown * 10',
    });
    expect(formatRunText(run)).toMatch(
      /^shown\s+Shown\s+2\n\(result\)\s+20\n$/
    );
  });
});
