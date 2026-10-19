import { describe, expect, test } from "vitest";

import {
  absolutePath,
  agentContext,
  problemLine,
  problemsText,
  renderCommand,
  runCommand,
  runStatusText,
  shellQuote,
  viewLink,
} from "../src/client/lib/agentContext.js";
import type { ActiveRun } from "../src/client/lib/stores/activeRun.js";

// Run ▸ Copy for Agent (spec §6.5).

const ROOT = "/Users/me/models";
const LINK =
  "http://127.0.0.1:4321/?file=models%2Ffruit.squiggle&view=relative-values&tab=grid&variable=fruit";

const okRun: ActiveRun = {
  path: "models/fruit.squiggle",
  status: "ok",
  ms: 142.4,
  executionId: 3,
  errors: [],
};

const errorRun: ActiveRun = {
  path: "models/fruit.squiggle",
  status: "error",
  ms: 12,
  executionId: 4,
  errors: [
    {
      kind: "runtime",
      message: "Expected a positive number,\n  got -1",
      location: { source: "models/fruit.squiggle", line: 14, column: 9 },
    },
    { kind: "other", message: "Something without a location" },
  ],
};

describe("agentContext", () => {
  test("the block of §6.5", () => {
    expect(
      agentContext({
        root: ROOT,
        state: {
          file: "models/fruit.squiggle",
          view: "relative-values",
          tab: "grid",
          variable: "fruit",
        },
        viewLabel: "Relative values",
        rvSpec: { name: "fruit", itemCount: 12 },
        link: LINK,
        run: okRun,
        dirty: false,
      })
    ).toBe(
      [
        "Squiggle Studio — models/fruit.squiggle → Relative values → Grid (spec fruit, 12 items)",
        "Root: /Users/me/models",
        `Link: ${LINK}`,
        "Run: squiggle-studio run /Users/me/models/models/fruit.squiggle --root /Users/me/models --json",
        "Render: squiggle-studio render /Users/me/models/models/fruit.squiggle --root /Users/me/models --view relative-values --tab grid --variable fruit",
        "Status: ok (142 ms), 0 errors",
      ].join("\n")
    );
  });

  test("errors and unsaved edits", () => {
    const text = agentContext({
      root: ROOT,
      state: { file: "models/fruit.squiggle", view: "output" },
      viewLabel: "Output",
      link: "http://127.0.0.1:4321/?file=models%2Ffruit.squiggle&view=output",
      run: errorRun,
      dirty: true,
    });
    const lines = text.split("\n");
    expect(lines[0]).toBe("Squiggle Studio — models/fruit.squiggle → Output");
    expect(lines).toContain("Status: error (12 ms), 2 errors");
    expect(lines).toContain(
      "Error (runtime) models/fruit.squiggle:14:9 Expected a positive number, got -1"
    );
    expect(lines).toContain("Error (other) Something without a location");
    expect(lines.at(-1)).toBe(
      "Unsaved edits: yes (agents read the file on disk; autosave writes it within 1 s)"
    );
  });

  test("the RV view without ?variable= renders the shown spec", () => {
    const text = agentContext({
      root: ROOT,
      state: { file: "rv.squiggle", view: "relative-values" },
      viewLabel: "Relative values",
      rvSpec: { name: "fruit", itemCount: 1 },
      link: "x",
      run: okRun,
      dirty: false,
    });
    expect(text).toContain("→ Relative values (spec fruit, 1 item)");
    expect(text).toContain("--view relative-values --variable fruit");
  });

  test("a text file has no run or render lines", () => {
    const text = agentContext({
      root: ROOT,
      state: { file: "notes.md" },
      link: "http://127.0.0.1:4321/?file=notes.md",
      dirty: false,
    });
    expect(text).toBe(
      [
        "Squiggle Studio — notes.md",
        "Root: /Users/me/models",
        "Link: http://127.0.0.1:4321/?file=notes.md",
      ].join("\n")
    );
  });

  test("Output with a variable", () => {
    const text = agentContext({
      root: ROOT,
      state: { file: "a.squiggle", view: "output", variable: "total" },
      viewLabel: "Output",
      link: "x",
      dirty: false,
    });
    expect(text.split("\n")[0]).toBe(
      "Squiggle Studio — a.squiggle → Output (variable total)"
    );
    expect(text).toContain("Status: not run yet");
  });
});

describe("commands", () => {
  test("run command: an absolute path, so it works from any directory", () => {
    expect(runCommand(ROOT, "lib/costs.squiggle")).toBe(
      "squiggle-studio run /Users/me/models/lib/costs.squiggle --root /Users/me/models --json"
    );
  });

  test("render command flags from the view state", () => {
    expect(renderCommand(ROOT, { file: "a.squiggle" })).toBe(
      "squiggle-studio render /Users/me/models/a.squiggle --root /Users/me/models"
    );
    expect(
      renderCommand(ROOT, {
        file: "a.squiggle",
        view: "output",
        layout: "list",
        variable: "x",
      })
    ).toBe(
      "squiggle-studio render /Users/me/models/a.squiggle --root /Users/me/models --layout list --variable x"
    );
    expect(
      renderCommand(ROOT, {
        file: "a.squiggle",
        view: "relative-values",
        tab: "plot",
      })
    ).toBe(
      "squiggle-studio render /Users/me/models/a.squiggle --root /Users/me/models --view relative-values --tab plot"
    );
    // The Playground can't be rendered; the command renders Output.
    expect(renderCommand(ROOT, { file: "a.squiggle", view: "split" })).toBe(
      "squiggle-studio render /Users/me/models/a.squiggle --root /Users/me/models"
    );
  });

  test("paths with spaces and quotes are shell-quoted", () => {
    expect(shellQuote("/Users/me/My Models")).toBe("'/Users/me/My Models'");
    expect(shellQuote("it's")).toBe(`'it'\\''s'`);
    expect(shellQuote("plain/path-1.squiggle")).toBe("plain/path-1.squiggle");
    expect(runCommand("/Users/me/My Models", "a b.squiggle")).toBe(
      "squiggle-studio run '/Users/me/My Models/a b.squiggle' --root '/Users/me/My Models' --json"
    );
  });

  test("absolutePath on Windows roots", () => {
    expect(absolutePath("C:\\Users\\me\\models", "lib/costs.squiggle")).toBe(
      "C:\\Users\\me\\models\\lib\\costs.squiggle"
    );
    expect(absolutePath("/Users/me/models/", "a.squiggle")).toBe(
      "/Users/me/models/a.squiggle"
    );
  });

  test("view link: the view state without per-window flags", () => {
    expect(
      viewLink("http://127.0.0.1:4321", "/", {
        file: "models/fruit.squiggle",
        view: "relative-values",
        tab: "grid",
        variable: "fruit",
      })
    ).toBe(LINK);
  });

  test("problems: one line each", () => {
    expect(problemsText(errorRun)).toBe(
      [
        "models/fruit.squiggle:14:9 runtime: Expected a positive number, got -1",
        "other: Something without a location",
      ].join("\n")
    );
    expect(problemLine(errorRun.errors[0]!)).toMatch(/^models\/fruit/);
  });

  test("status text", () => {
    expect(runStatusText(undefined)).toBe("not run yet");
    expect(runStatusText({ ...okRun, status: "running" })).toBe("running");
    expect(runStatusText({ ...okRun, status: "not-run" })).toMatch(/not run/);
    expect(
      runStatusText({ ...errorRun, errors: errorRun.errors.slice(0, 1) })
    ).toBe("error (12 ms), 1 error");
  });
});
