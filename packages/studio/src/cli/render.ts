import fs from "node:fs";
import path from "node:path";

import { startStudioServer } from "../server/server.js";

// The tiny subset of the puppeteer-core API that we use. puppeteer-core is an
// optional dependency, so we don't depend on its types at build time.
type PuppeteerPage = {
  setViewport(v: {
    width: number;
    height: number;
    deviceScaleFactor?: number;
  }): Promise<void>;
  goto(
    url: string,
    opts: { waitUntil: string; timeout: number }
  ): Promise<unknown>;
  waitForSelector(
    selector: string,
    opts: { timeout: number }
  ): Promise<unknown>;
  evaluate<T>(expression: string): Promise<T>;
  screenshot(opts: { path: string; fullPage: boolean }): Promise<unknown>;
};
type PuppeteerBrowser = {
  newPage(): Promise<PuppeteerPage>;
  close(): Promise<void>;
};
type Puppeteer = {
  launch(opts: {
    executablePath: string;
    headless: boolean;
    args: string[];
  }): Promise<PuppeteerBrowser>;
};

const CHROME_CANDIDATES = [
  process.env["CHROME_PATH"],
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
];

function findChrome(explicit?: string): string {
  const candidates = explicit ? [explicit] : CHROME_CANDIDATES;
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  throw new Error(
    "Couldn't find Chrome or Chromium. Install Chrome, or pass --chrome <path> (or set CHROME_PATH)."
  );
}

async function loadPuppeteer(): Promise<Puppeteer> {
  // Indirect specifier so that TypeScript and bundlers don't require the module.
  const specifier = "puppeteer-core";
  try {
    const mod = (await import(specifier)) as { default: Puppeteer };
    return mod.default;
  } catch {
    throw new Error(
      "`squiggle-studio render` needs the optional dependency puppeteer-core.\n" +
        "Install it next to squiggle-studio, e.g. `npm install -g puppeteer-core` or `pnpm add puppeteer-core`."
    );
  }
}

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
