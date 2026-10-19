import path from "node:path";

import { type Command, Option } from "@commander-js/extra-typings";

import type { ErrorJson } from "@quri/squiggle-lang";

import {
  resolveRunTarget,
  RunTimeoutError,
  runStudioFile,
  studioRunInfo,
  StudioUsageError,
} from "../../server/runner.js";
import { type ViewState, viewStateFromSearch } from "../../shared/viewState.js";
import {
  EXIT,
  parseDuration,
  parsePort,
  parseWidth,
  writeStderr,
  writeStdout,
} from "../args.js";
import { type RenderTab, renderToPng, type RenderView } from "../render.js";
import { formatErrorLine } from "./run.js";

// `squiggle-studio render <file>` (spec §6.3): a PNG of any view, for agents
// to judge whether something looks right (numbers come from `run --json` and
// `rv`). Validates everything it can before Chrome starts, waits for Studio
// to be idle (or to show an error) instead of fixed sleeps, and exits 1 when
// the model, the spec or the requested view, tab or variable has a problem;
// the PNG is still written so the error state can be inspected.

const VIEWS = ["output", "relative-values"] as const;
const TABS = ["list", "grid", "plot"] as const;
const LAYOUTS = ["cards", "list"] as const;
const SCALES = ["1", "2"] as const;

export const RENDER_HELP = `
Root: --root, else the current directory when the file is inside it, else the
file's folder (so ../ imports resolve when you run it from the project root).

Examples:
  $ squiggle-studio render models/costs.squiggle
  $ squiggle-studio render models/fruit.squiggle --view relative-values --tab grid
  $ squiggle-studio render models/costs.squiggle --variable total --json
  $ squiggle-studio render --url 'http://127.0.0.1:4321/?file=models%2Ffruit.squiggle&view=relative-values&tab=plot'

--json prints {ok, out, width, height, view, errors, studioErrors,
consoleErrors, timeMs}. Exit codes: 0 ok, 1 errors in the model, spec, view,
tab or variable (the PNG is still written), 2 usage or file error, 124 timeout.
For numbers, use \`squiggle-studio run --json\` or \`rv\` instead of pixels.`;

export type RenderJson = {
  ok: boolean;
  out: string[];
  width: number;
  height: number;
  view: string;
  errors: ErrorJson[]; // the model's errors (`run --json`'s)
  studioErrors: string[]; // what the page or the checks reported
  consoleErrors: string[];
  timeMs: number;
};

// The view state to render: --url's, overridden by explicit flags.
export function renderViewState(
  file: string | undefined,
  options: {
    url?: string;
    view?: RenderView;
    tab?: RenderTab;
    variable?: string;
    layout?: "cards" | "list";
  }
): ViewState & { file: string; view: RenderView } {
  let fromUrl: ViewState = {};
  if (options.url !== undefined) {
    let url: URL;
    try {
      url = new URL(options.url);
    } catch {
      throw new StudioUsageError(`--url isn't a URL: ${options.url}`);
    }
    fromUrl = viewStateFromSearch(url.search);
    if (!fromUrl.file) {
      throw new StudioUsageError(
        "--url has no ?file= parameter (copy the link with a file shown)"
      );
    }
  }
  const target = file ?? fromUrl.file;
  if (!target) {
    throw new StudioUsageError("Give a .squiggle file to render, or --url");
  }
  const tab = options.tab ?? fromUrl.tab;
  const urlView =
    fromUrl.view === "output" || fromUrl.view === "relative-values"
      ? fromUrl.view
      : undefined;
  if (fromUrl.view !== undefined && !urlView && !options.view) {
    throw new StudioUsageError(
      `--url shows the "${fromUrl.view}" view; render can show "output" or "relative-values" (add --view)`
    );
  }
  // A tab implies the relative values view.
  const view = options.view ?? urlView ?? (tab ? "relative-values" : "output");
  if (tab && view !== "relative-values") {
    throw new StudioUsageError(`--tab applies to --view relative-values`);
  }
  const layout = options.layout ?? fromUrl.layout;
  if (layout && view !== "output") {
    throw new StudioUsageError(`--layout applies to --view output`);
  }
  return {
    file: target,
    view,
    ...(tab ? { tab } : {}),
    ...((options.variable ?? fromUrl.variable)
      ? { variable: options.variable ?? fromUrl.variable }
      : {}),
    ...(layout ? { layout } : {}),
  };
}

export function register(program: Command): void {
  program
    .command("render")
    .description(
      "Render a view of a .squiggle file to a PNG (needs puppeteer-core and a local Chrome)."
    )
    .argument("[file]", ".squiggle file to render (or use --url)")
    .option("-o, --out <file>", "output PNG path (default: <file>.png)")
    .option(
      "--root <dir>",
      "the open folder: imports may not leave it (default: the current directory when the file is inside it, else the file's folder)"
    )
    .addOption(
      new Option("--view <view>", 'view to render (default "output")').choices(
        VIEWS
      )
    )
    .addOption(
      new Option(
        "--tab <tab>",
        'relative values tab (default "list"); implies --view relative-values'
      ).choices(TABS)
    )
    .option(
      "--variable <name>",
      "render only this variable (with --view relative-values: the spec to show)"
    )
    .addOption(
      new Option("--layout <layout>", "Output layout").choices(LAYOUTS)
    )
    .option(
      "--url <link>",
      "render the view of a link copied from Studio (?file=…&view=…&tab=…); flags override it"
    )
    .option(
      "--width <px>",
      "viewport width in CSS pixels, 200–8000",
      parseWidth,
      1000
    )
    .addOption(
      new Option("--scale <n>", "device pixel ratio")
        .choices(SCALES)
        .default("1")
    )
    .option("--json", "print a JSON report instead of the PNG path")
    .option(
      "--timeout <duration>",
      'give up waiting after this long, e.g. "60s"; 0 for no limit',
      parseDuration,
      60_000
    )
    .option(
      "--port <port>",
      "port of the temporary server (default: any free port)",
      parsePort
    )
    .option("--chrome <path>", "path to a Chrome/Chromium executable")
    .addHelpText("after", RENDER_HELP)
    .action(async (file, options) => {
      const started = Date.now();
      const state = renderViewState(file, options);
      const root = options.root ? path.resolve(options.root) : undefined;
      const target = await resolveRunTarget({
        file: state.file,
        root,
        // A --url file is root-relative; a file argument is cwd-relative.
        cwd: file === undefined ? root : undefined,
      });
      const out = options.out
        ? path.resolve(options.out)
        : target.abs.replace(/\.squiggle$/, "") + ".png";
      const hubUrl = process.env["SQUIGGLE_HUB_URL"] || undefined;

      // The model's errors and what the requested view needs, from the same
      // runner as `run --json` (the page marks these too, with
      // data-studio-error).
      const checks: string[] = [];
      let errors: ErrorJson[] = [];
      let timedOut = false;
      try {
        const run = await runStudioFile({
          root: target.root,
          path: target.path,
          timeoutMs: options.timeout,
          hubUrl,
        });
        errors = run.json.errors;
        if (run.json.ok) {
          const info = studioRunInfo(target.root, run);
          const specs = info.relativeValues.map((r) => r.name);
          if (state.view === "relative-values" && !specs.length) {
            checks.push(`No relative values spec in ${target.path}`);
          } else if (
            state.view === "relative-values" &&
            state.variable &&
            !specs.includes(state.variable)
          ) {
            checks.push(
              `No relative values spec "${state.variable}" in ${target.path} (specs: ${specs.join(", ")})`
            );
          } else if (
            state.view === "output" &&
            state.variable &&
            !(state.variable in run.json.bindings)
          ) {
            checks.push(`Variable ${state.variable} is not defined`);
          }
          for (const r of info.relativeValues) {
            if (!r.ok && (!state.variable || state.variable === r.name)) {
              checks.push(`${r.name}: ${r.error}`);
            }
          }
        }
      } catch (e) {
        if (!(e instanceof RunTimeoutError)) throw e;
        timedOut = true;
        checks.push(`${e.message} (--timeout)`);
      }

      const result = await renderToPng({
        root: target.root,
        path: target.path,
        out,
        view: state.view,
        tab: state.tab,
        variable: state.variable,
        layout: state.layout,
        width: options.width,
        scale: options.scale === "2" ? 2 : 1,
        timeoutMs: options.timeout,
        chromePath: options.chrome,
        port: options.port,
        hubUrl,
      });
      const studioErrors = [...new Set([...checks, ...result.studioErrors])];
      if (result.timedOut) {
        timedOut = true;
        studioErrors.push(
          `Studio didn't finish within ${options.timeout} ms (--timeout)`
        );
      }
      const ok = errors.length === 0 && studioErrors.length === 0;
      const exitCode = timedOut ? EXIT.timeout : ok ? EXIT.ok : EXIT.modelError;

      if (options.json) {
        const json: RenderJson = {
          ok,
          out: [result.out],
          width: result.width,
          height: result.height,
          view: result.view,
          errors,
          studioErrors,
          consoleErrors: result.consoleErrors,
          timeMs: Date.now() - started,
        };
        await writeStdout(JSON.stringify(json, null, 2) + "\n");
      } else {
        await writeStdout(`Wrote ${result.out}\n`);
        const problems = [
          ...errors.map(formatErrorLine),
          ...studioErrors.filter(
            (e) => !errors.some((err) => e.includes(err.message))
          ),
        ];
        if (problems.length) {
          await writeStderr(
            `The ${state.view} view has problems:\n${problems.map((p) => `  ${p}`).join("\n")}\n`
          );
        }
        await writeStderr(
          "For numbers, use `squiggle-studio run --json` or `squiggle-studio rv`.\n"
        );
      }
      process.exitCode = exitCode;
    });
}
