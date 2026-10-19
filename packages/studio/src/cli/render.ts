import fs from "node:fs";
import path from "node:path";

import { startStudioServer } from "../server/server.js";
import { findChrome, loadPuppeteer } from "./browser.js";

export async function renderToPng(params: {
  file: string; // absolute path to a .squiggle file
  out?: string; // absolute path of the PNG; defaults to <file>.png
  variable?: string; // render a single variable
  view?: string; // view id, e.g. "relative-values"; defaults to "output"
  tab?: string; // relative values dashboard tab: "list", "grid" or "plot"
  width?: number;
  chromePath?: string;
}): Promise<string> {
  if (!fs.existsSync(params.file)) {
    throw new Error(`File not found: ${params.file}`);
  }
  const puppeteer = await loadPuppeteer();
  const executablePath = findChrome(params.chromePath);
  const out = params.out ?? params.file.replace(/\.squiggle$/, "") + ".png";

  const server = await startStudioServer({
    root: path.dirname(params.file),
    port: 0,
    allowOpenFolder: false,
  });
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-first-run", "--no-default-browser-check"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: params.width ?? 1000,
      height: 100, // the page grows to fit; we take a full-page screenshot
      deviceScaleFactor: 2,
    });
    const query = new URLSearchParams({
      file: path.basename(params.file),
      view: params.view ?? "output",
      embed: "1",
    });
    if (params.variable) query.set("variable", params.variable);
    if (params.tab) query.set("tab", params.tab);
    await page.goto(`${server.url}/?${query}`, {
      waitUntil: "load", // not networkidle: the SSE stream stays open
      timeout: 60_000,
    });
    await page.waitForSelector("[data-studio-ready='1']", { timeout: 60_000 });
    // Relative values dashboards compute pairs in the background, with a
    // progress bar marked with `data-rv-computing`.
    await page.waitForFunction(
      `!document.querySelector("[data-rv-computing]")`,
      { timeout: 120_000 }
    );
    // Give canvases a moment to paint after layout.
    await new Promise((resolve) => setTimeout(resolve, 500));
    const error = await page.evaluate<string | null>(
      `document.querySelector("[data-studio-error]")?.textContent ?? null`
    );
    await page.screenshot({ path: out, fullPage: true });
    if (error) {
      process.stderr.write(`Warning: the model has errors:\n${error}\n`);
    }
  } finally {
    await browser.close();
    await server.close();
  }
  return out;
}
