import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { SqModule, SqProject } from "@quri/squiggle-lang";
import { describe, expect, test, vi } from "vitest";

import {
  makeStudioLinker,
  resolveStudioImport as resolveInBrowser,
} from "../src/client/lib/linker.js";
import {
  makeNodeLinker,
  resolveStudioImport as resolveInNode,
} from "../src/server/linker.js";

vi.mock("../src/client/lib/api.js", () => ({
  api: {
    readFile: async (path: string) => {
      if (path === "lib/costs.squiggle") {
        return { content: "export cost = 5" };
      }
      throw new Error(`Not found: ${path}`);
    },
    getHubSource: async () => {
      throw new Error("Hub is not available in tests");
    },
  },
}));

async function run(code: string, name = "main.squiggle") {
  const project = new SqProject({ linker: makeStudioLinker() });
  project.setHead("main", { module: new SqModule({ name, code }) });
  return project.waitForOutput("main");
}

describe("makeStudioLinker", () => {
  test("resolves relative imports from the importing file", async () => {
    const output = await run(
      'import "./costs.squiggle" as costs\nx = costs.cost * 2',
      "lib/main.squiggle"
    );
    expect(output.result.ok).toBe(true);
  });

  // Regression: a throwing `resolve` escaped squiggle-lang's import handling and
  // the run never finished.
  test.each([
    ['import "../outside.squiggle" as o\nx = o', "escapes the open folder"],
    ['import "plain-name" as o\nx = o', "Unsupported import"],
    ['import "hub:not-a-hub-id" as o\nx = o', "Invalid Hub import"],
  ])("reports invalid import %j as an error", async (code, message) => {
    const output = await run(code);
    expect(output.result.ok).toBe(false);
    expect(output.result.ok ? "" : output.result.value.toString()).toContain(
      message
    );
  });
});

// The CLI (src/server/linker.ts) must resolve imports exactly as the page
// does, or `squiggle-studio run` would compute something else than the UI.
describe("browser and Node linkers agree", () => {
  const outcome =
    (resolve: (name: string, from: string) => string) =>
    (name: string, from: string): string => {
      try {
        return `ok ${resolve(name, from)}`;
      } catch (e) {
        return `error ${e instanceof Error ? e.message : String(e)}`;
      }
    };

  test.each([
    ["./costs.squiggle", "main.squiggle"],
    ["./costs.squiggle", "lib/main.squiggle"],
    ["../lib/costs.squiggle", "models/main.squiggle"],
    ["../../shared.squiggle", "deep/a/b/x.squiggle"],
    ["./a/../b/./c.squiggle", "m/x.squiggle"],
    ["../outside.squiggle", "main.squiggle"],
    ["../../outside.squiggle", "a/main.squiggle"],
    ["plain-name", "main.squiggle"],
    ["/abs/path.squiggle", "main.squiggle"],
    ["hub:quri/model", "lib/main.squiggle"],
    ["hub:not-a-hub-id", "main.squiggle"],
    ["hub:a/b/c", "main.squiggle"],
  ])("%s from %s", (name, from) => {
    expect(outcome(resolveInNode)(name, from)).toBe(
      outcome(resolveInBrowser)(name, from)
    );
  });

  test("the Node linker reads files with the server's rules", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "studio-linker-"));
    try {
      await fs.mkdir(path.join(root, "lib"));
      await fs.writeFile(
        path.join(root, "lib", "costs.squiggle"),
        "export cost = 5"
      );
      await fs.mkdir(path.join(root, ".hidden"));
      await fs.writeFile(
        path.join(root, ".hidden", "x.squiggle"),
        "export y = 1"
      );
      const linker = makeNodeLinker({ root, hubUrl: "http://127.0.0.1:9" });
      const runWith = async (code: string) => {
        const project = new SqProject({ linker });
        project.setHead("main", {
          module: new SqModule({ name: "main.squiggle", code }),
        });
        return project.waitForOutput("main");
      };

      const ok = await runWith(
        'import "./lib/costs.squiggle" as c\nx = c.cost'
      );
      expect(ok.result.ok).toBe(true);
      expect(linker.loaded).toEqual(["lib/costs.squiggle"]);
      expect(linker.sources.get("lib/costs.squiggle")).toBe("export cost = 5");

      for (const [code, message] of [
        [
          'import "./missing.squiggle" as m\nx = m',
          "File not found: missing.squiggle",
        ],
        ['import "./.hidden/x.squiggle" as m\nx = m', "Hidden files"],
        ['import "../up.squiggle" as m\nx = m', "escapes the open folder"],
      ] as const) {
        const output = await runWith(code);
        expect(
          output.result.ok ? "" : output.result.value.toString()
        ).toContain(message);
      }
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });
});
