import path from "node:path";

import type { Command } from "@commander-js/extra-typings";

import { renderToPng } from "../render.js";
import { parsePort } from "./serve.js";

// `squiggle-studio render <file>`: a headless screenshot of a file's output.
// The browser part (renderToPng) lives in ../render.ts.
export function register(program: Command): void {
  program
    .command("render")
    .description(
      "Render a .squiggle file's output to a PNG (requires puppeteer-core and a local Chrome)."
    )
    .argument("<file>", ".squiggle file to render")
    .option("-o, --out <file>", "output PNG path (default: <file>.png)")
    .option(
      "--variable <name>",
      "render only this variable (with --view relative-values: the spec to show)"
    )
    .option(
      "--view <id>",
      'view to render: "output" (default) or "relative-values"'
    )
    .option(
      "--tab <tab>",
      'relative values tab: "list" (default), "grid" or "plot"'
    )
    .option("--width <px>", "viewport width", parsePort, 1000)
    .option("--chrome <path>", "path to a Chrome/Chromium executable")
    .action(async (file, options) => {
      const out = await renderToPng({
        file: path.resolve(file),
        out: options.out ? path.resolve(options.out) : undefined,
        variable: options.variable,
        view: options.view,
        tab: options.tab,
        width: options.width,
        chromePath: options.chrome,
      });
      process.stdout.write(`Wrote ${out}\n`);
    });
}
