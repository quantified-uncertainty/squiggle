import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { freePort } from "./lib/ports.js";

// `squiggle-studio render` end to end (spec §6.3; QA #23, #25, #47, #48):
// the CLI as a child process (`tsx src/cli/index.ts`) against the built
// client, with an isolated HOME and headless Chrome.

const STUDIO_DIR = path.resolve(import.meta.dirname, "..");
const CLI = path.join(STUDIO_DIR, "src", "cli", "index.ts");
const TSX = createRequire(import.meta.url).resolve("tsx/cli");

let tmp: string;
let home: string;
let models: string; // a copy of packages/studio/examples
let out: string;

beforeAll(async () => {
  tmp = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "studio-cli-e2e-"))
  );
  home = path.join(tmp, "home");
  models = path.join(tmp, "models");
  out = path.join(tmp, "out");
  await fs.mkdir(home);
  await fs.mkdir(out);
  await fs.cp(path.join(STUDIO_DIR, "examples"), models, { recursive: true });
  await fs.writeFile(path.join(models, "notes.md"), "# readme\n");
  await fs.writeFile(path.join(models, ".hidden.squiggle"), "x = 1 to 3\n");
  await fs.writeFile(path.join(models, "broken.squiggle"), "x = (1 +\n");
});

afterAll(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

type Result = {
  code: number | null;
  stdout: string;
  stderr: string;
  ms: number;
};

async function render(args: string[], cwd = models): Promise<Result> {
  const port = await freePort();
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [TSX, CLI, "render", ...args, "--port", String(port)],
      { cwd, env: { ...process.env, HOME: home, USERPROFILE: home } }
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    child.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) =>
      resolve({ code, stdout, stderr, ms: Date.now() - started })
    );
  });
}

type RenderJson = {
  ok: boolean;
  out: string[];
  width: number;
  height: number;
  view: string;
  errors: Array<{ kind: string; message: string }>;
  studioErrors: string[];
  consoleErrors: string[];
  timeMs: number;
};

async function renderJson(
  args: string[],
  cwd?: string
): Promise<Result & { json: RenderJson }> {
  const result = await render([...args, "--json"], cwd);
  let json: RenderJson;
  try {
    json = JSON.parse(result.stdout) as RenderJson;
  } catch {
    throw new Error(
      `render ${args.join(" ")} printed no JSON (exit ${result.code}):\n${result.stdout}\n${result.stderr}`
    );
  }
  return { ...result, json };
}

async function pngWidth(file: string): Promise<number> {
  const buffer = await fs.readFile(file);
  expect(buffer.subarray(1, 4).toString()).toBe("PNG");
  return buffer.readUInt32BE(16);
}

describe("render", () => {
  test("a file that imports from a parent folder, with --root (#23)", async () => {
    const png = path.join(out, "with-imports.png");
    const r = await renderJson([
      "relative-values/with-imports.squiggle",
      "--root",
      ".",
      "--view",
      "relative-values",
      "--tab",
      "grid",
      "-o",
      png,
    ]);
    expect(r.code, r.stderr).toBe(0);
    expect(r.json).toMatchObject({
      ok: true,
      out: [png],
      width: 1000,
      view: "relative-values",
      errors: [],
      studioErrors: [],
    });
    expect(r.json.height).toBeGreaterThan(100);
    expect(typeof r.json.timeMs).toBe("number");
    expect(await pngWidth(png)).toBe(1000);
  });

  test("the root defaults to the current directory", async () => {
    const png = path.join(out, "from-cwd.png");
    const r = await render([
      "relative-values/with-imports.squiggle",
      "-o",
      png,
    ]);
    expect(r.code, r.stderr).toBe(0);
    expect(r.stdout).toBe(`Wrote ${png}\n`);
    expect(r.stderr).toContain("squiggle-studio run --json");
  });

  test("a parse error exits 1 with the PNG written", async () => {
    const png = path.join(out, "broken.png");
    const r = await renderJson(["broken.squiggle", "-o", png]);
    expect(r.code).toBe(1);
    expect(r.json.ok).toBe(false);
    expect(r.json.errors[0]).toMatchObject({ kind: "compile" });
    expect(await pngWidth(png)).toBe(1000);
  });

  test("--view relative-values on a file without a spec exits 1 fast (#47)", async () => {
    const png = path.join(out, "no-spec.png");
    const r = await renderJson([
      "main.squiggle",
      "--view",
      "relative-values",
      "-o",
      png,
    ]);
    expect(r.code).toBe(1);
    expect(r.json.studioErrors).toContain(
      "No relative values spec in main.squiggle"
    );
    expect(r.ms).toBeLessThan(5_000);
    expect(await pngWidth(png)).toBe(1000);
  });

  test("an unknown --variable exits 1 (#47)", async () => {
    const output = await renderJson([
      "main.squiggle",
      "--variable",
      "nope",
      "-o",
      path.join(out, "nope.png"),
    ]);
    expect(output.code).toBe(1);
    expect(output.json.studioErrors).toContain("Variable nope is not defined");

    const rv = await renderJson([
      "relative-values/minimal.squiggle",
      "--view",
      "relative-values",
      "--variable",
      "nope",
      "-o",
      path.join(out, "rv-nope.png"),
    ]);
    expect(rv.code).toBe(1);
    expect(rv.json.studioErrors.join("\n")).toMatch(
      /No relative values spec "nope"/
    );
  });

  test.each([
    [["notes.md"], /Expected a \.squiggle file/],
    [["lib"], /Not a file/],
    [[".hidden.squiggle"], /hidden/],
    [["main.squiggle", "--view", "split"], /Allowed choices/],
  ])(
    "%j fails in under 5 s with a clear message (#25)",
    async (args, message) => {
      const r = await render(args);
      expect(r.code).toBe(2);
      expect(r.stderr).toMatch(message);
      expect(r.ms).toBeLessThan(5_000);
    }
  );

  test("--scale: the PNG is --width (or twice it) pixels wide", async () => {
    const one = path.join(out, "scale-1.png");
    const r1 = await renderJson(["main.squiggle", "--width", "640", "-o", one]);
    expect(r1.code, r1.stderr).toBe(0);
    expect(await pngWidth(one)).toBe(640);
    expect(r1.json.width).toBe(640);

    const two = path.join(out, "scale-2.png");
    const r2 = await renderJson([
      "main.squiggle",
      "--width",
      "640",
      "--scale",
      "2",
      "-o",
      two,
    ]);
    expect(r2.code, r2.stderr).toBe(0);
    expect(await pngWidth(two)).toBe(1280);
  });

  test("--url renders the view of a copied link", async () => {
    const png = path.join(out, "url.png");
    const r = await renderJson(
      [
        "--url",
        "http://127.0.0.1:4321/?file=relative-values%2Fminimal.squiggle&view=relative-values&tab=plot",
        "--root",
        models,
        "-o",
        png,
      ],
      tmp
    );
    expect(r.code, r.stderr).toBe(0);
    expect(r.json.view).toBe("relative-values");
    expect(r.json.out).toEqual([png]);
  });

  test("renders never touch ~/.squiggle-studio (#48)", async () => {
    // Every render above ran with this HOME.
    await expect(
      fs.stat(path.join(home, ".squiggle-studio"))
    ).rejects.toMatchObject({ code: "ENOENT" });
  });
});
