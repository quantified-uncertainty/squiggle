import { SqModule, SqProject } from "@quri/squiggle-lang";
import { describe, expect, test, vi } from "vitest";

import { makeStudioLinker } from "../src/client/lib/linker.js";

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
