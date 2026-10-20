// What Run ▸ Copy for Agent copies (spec §6.5): a context block naming the
// shown view, the root, a link, the CLI commands that reproduce it and the
// run status; the run and render commands alone; the problems. Pure
// functions, so the formats are unit-tested (test/agentContext.test.ts).

import { type ViewState, viewStateToSearch } from "../../shared/viewState.js";
import type { ActiveRun } from "./stores/activeRun.js";

const TAB_LABELS: Record<NonNullable<ViewState["tab"]>, string> = {
  list: "List",
  grid: "Grid",
  plot: "Plot",
};

// Single-quotes a shell argument unless it only has safe characters.
export function shellQuote(arg: string): string {
  return /^[\w@%+=:,./-]+$/.test(arg) ? arg : `'${arg.replace(/'/g, `'\\''`)}'`;
}

// The absolute path of a root-relative file. A Windows root (with
// backslashes) gets backslashes.
export function absolutePath(root: string, file: string): string {
  const windows = root.includes("\\");
  const sep = windows ? "\\" : "/";
  const rel = windows ? file.replace(/\//g, "\\") : file;
  return `${root.replace(/[\\/]+$/, "")}${sep}${rel}`;
}

// `squiggle-studio run <abs> --root <root> --json`: an absolute file path, so
// it works from any directory.
export function runCommand(root: string, file: string): string {
  return [
    "squiggle-studio run",
    shellQuote(absolutePath(root, file)),
    "--root",
    shellQuote(root),
    "--json",
  ].join(" ");
}

// `squiggle-studio render <abs> --root <root>` plus the current view's
// --view, --tab, --variable and --layout.
export function renderCommand(root: string, state: ViewState): string {
  if (!state.file) throw new Error("renderCommand needs a file");
  const parts = [
    "squiggle-studio render",
    shellQuote(absolutePath(root, state.file)),
    "--root",
    shellQuote(root),
  ];
  const view = state.view === "relative-values" ? state.view : "output";
  if (view === "relative-values") {
    parts.push("--view", view);
    if (state.tab) parts.push("--tab", state.tab);
  } else if (state.layout === "list") {
    parts.push("--layout", "list");
  }
  if (state.variable) parts.push("--variable", shellQuote(state.variable));
  return parts.join(" ");
}

// The address of the current view, without per-window flags (test, menubar).
export function viewLink(
  origin: string,
  pathname: string,
  state: ViewState
): string {
  return `${origin}${pathname}${viewStateToSearch(state)}`;
}

type Problem = ActiveRun["errors"][number];

function problemWhere(error: Problem): string {
  return error.location
    ? `${error.location.source}:${error.location.line}:${error.location.column} `
    : "";
}

function oneLine(message: string): string {
  return message.replace(/\s*\n\s*/g, " ");
}

// "models/fruit.squiggle:14:9 runtime: message"
export function problemLine(error: Problem): string {
  return `${problemWhere(error)}${error.kind}: ${oneLine(error.message)}`;
}

export function problemsText(run: ActiveRun): string {
  return run.errors.map(problemLine).join("\n");
}

export function runStatusText(run: ActiveRun | undefined): string {
  if (!run) return "not run yet";
  const count = run.errors.length;
  const errors = `${count} error${count === 1 ? "" : "s"}`;
  const ms = run.ms === undefined ? "" : ` (${Math.round(run.ms)} ms)`;
  switch (run.status) {
    case "ok":
      return `ok${ms}, ${errors}`;
    case "error":
      return `error${ms}, ${errors}`;
    case "running":
      return "running";
    case "not-run":
      return "not run (auto-run is off; Run ▸ Run)";
  }
}

export type AgentContextInput = {
  root: string;
  state: ViewState & { file: string };
  viewLabel?: string; // "Relative values"
  rvSpec?: { name: string; itemCount?: number }; // the spec the RV view shows
  link: string;
  run?: ActiveRun; // the shown file's run (Squiggle files)
  dirty: boolean;
};

// The block of §6.5, e.g.
//   Squiggle Studio — models/fruit.squiggle → Relative values → Grid (spec fruit, 12 items)
//   Root: /Users/me/models
//   Link: http://127.0.0.1:4321/?file=models%2Ffruit.squiggle&view=relative-values&tab=grid
//   Run: squiggle-studio run /Users/me/models/models/fruit.squiggle --root /Users/me/models --json
//   Render: squiggle-studio render … --view relative-values --tab grid --variable fruit
//   Status: ok (142 ms), 0 errors
export function agentContext(input: AgentContextInput): string {
  const { root, state } = input;
  const isSquiggle = state.file.endsWith(".squiggle");
  let title = `Squiggle Studio — ${state.file}`;
  if (isSquiggle && input.viewLabel) title += ` → ${input.viewLabel}`;
  if (state.view === "relative-values") {
    if (state.tab) title += ` → ${TAB_LABELS[state.tab]}`;
    const spec = input.rvSpec;
    if (spec) {
      const items =
        spec.itemCount === undefined
          ? ""
          : `, ${spec.itemCount} item${spec.itemCount === 1 ? "" : "s"}`;
      title += ` (spec ${spec.name}${items})`;
    }
  } else if (state.variable) {
    title += ` (variable ${state.variable})`;
  }

  const lines = [title, `Root: ${root}`, `Link: ${input.link}`];
  if (isSquiggle) {
    const renderState: ViewState = {
      ...state,
      ...(state.view === "relative-values" && input.rvSpec && !state.variable
        ? { variable: input.rvSpec.name }
        : {}),
    };
    lines.push(
      `Run: ${runCommand(root, state.file)}`,
      `Render: ${renderCommand(root, renderState)}`,
      `Status: ${runStatusText(input.run)}`
    );
    for (const error of input.run?.errors ?? []) {
      // "Error (runtime) models/fruit.squiggle:14:9 message"
      lines.push(
        `Error (${error.kind}) ${problemWhere(error)}${oneLine(error.message)}`
      );
    }
  }
  if (input.dirty) {
    lines.push(
      "Unsaved edits: yes (agents read the file on disk; autosave writes it within 1 s)"
    );
  }
  return lines.join("\n");
}
