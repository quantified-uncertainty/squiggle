import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { startStudioServer } from "../server/server.js";
import { viewStateToSearch } from "../shared/viewState.js";
import { findChrome, loadPuppeteer, type PuppeteerBrowser } from "./browser.js";

// `squiggle-studio render`'s browser part: serve the root with a temporary
// Studio server, open the file in embed mode (`?embed=1`, the workspace
// only) in headless Chrome, wait until Studio is idle or shows an error, and
// take a full-page screenshot.

export type RenderView = "output" | "relative-values";
export type RenderTab = "list" | "grid" | "plot";

export type RenderParams = {
  root: string; // absolute path of the folder to serve
  path: string; // root-relative path of the .squiggle file
  out: string; // absolute path of the PNG
  view: RenderView;
  tab?: RenderTab; // relative values tab
  variable?: string; // one variable (Output) or the spec (relative values)
  layout?: "cards" | "list"; // Output layout
  width: number; // CSS pixels
  scale: 1 | 2; // device pixel ratio
  timeoutMs: number;
  chromePath?: string;
  port?: number; // the temporary server's port; default: any free port
  hubUrl?: string;
};

export type RenderResult = {
  out: string;
  width: number; // of the PNG, in pixels
  height: number;
  view: string; // the view the page shows (<html data-studio-view>)
  studioErrors: string[]; // text of the page's [data-studio-error] markers
  consoleErrors: string[]; // console errors and uncaught page errors
  timedOut: boolean; // not idle within timeoutMs (the PNG is still written)
};

type IdleAnswer = { idle: boolean; timedOut: boolean };

// Runs in the page (a string, so that no bundler or tsx transform touches
// it). Waits for window.squiggleStudio.whenIdle() or a [data-studio-error]
// marker, whichever comes first, then until every [data-studio-ready] marker
// says "1" (there is at least one) and no relative values dashboard is
// computing, then fonts and two frames, so canvases have painted.
const WAIT_FOR_STUDIO = `async (timeoutMs) => {
  const start = performance.now();
  const left = () => timeoutMs - (performance.now() - start);
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const frame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
  const errorShown = () => document.querySelector("[data-studio-error]") !== null;
  const settled = () => {
    if (document.querySelector("[data-rv-computing]")) return false;
    if (errorShown()) return true;
    const markers = [...document.querySelectorAll("[data-studio-ready]")];
    return markers.length > 0 && markers.every((m) => m.getAttribute("data-studio-ready") === "1");
  };
  const timedOut = { idle: false, timedOut: true };
  while (!window.squiggleStudio?.whenIdle && !errorShown()) {
    if (left() <= 0) return timedOut;
    await sleep(20);
  }
  if (!errorShown()) {
    const errorWait = (async () => {
      while (!errorShown() && left() > 0) await sleep(50);
      return { idle: errorShown(), timedOut: !errorShown() };
    })();
    const answer = await Promise.race([
      window.squiggleStudio.whenIdle(Math.max(0, left())),
      errorWait,
    ]);
    if (!answer.idle) return timedOut;
  }
  while (!settled()) {
    if (left() <= 0) return timedOut;
    await sleep(25);
  }
  await document.fonts.ready;
  await frame();
  await frame();
  return { idle: true, timedOut: false };
}`;

const STUDIO_ERRORS = `[...document.querySelectorAll("[data-studio-error]")]
  .map((el) => (el.textContent || "").trim())
  .filter(Boolean)`;

// Width and height of a PNG, from its IHDR chunk.
async function pngSize(
  file: string
): Promise<{ width: number; height: number }> {
  const handle = await fs.open(file, "r");
  try {
    const header = Buffer.alloc(24);
    await handle.read(header, 0, 24, 0);
    return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
  } finally {
    await handle.close();
  }
}

export function renderSearch(params: RenderParams): string {
  return viewStateToSearch(
    {
      file: params.path,
      view: params.view,
      tab: params.tab,
      variable: params.variable,
      layout: params.layout,
    },
    { embed: "1" }
  );
}

// Opens the view in `browser` and takes the screenshot.
async function capture(
  browser: PuppeteerBrowser,
  url: string,
  params: RenderParams
): Promise<RenderResult> {
  const consoleErrors: string[] = [];
  const page = await browser.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error instanceof Error ? error.message : String(error));
  });
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await page.setViewport({
    width: params.width,
    height: 100, // the page grows to fit; we take a full-page screenshot
    deviceScaleFactor: params.scale,
  });
  await page.goto(url, {
    waitUntil: "load", // not networkidle: the SSE stream stays open
    timeout: params.timeoutMs || 60_000,
  });
  const answer = await page.evaluate<IdleAnswer>(
    `(${WAIT_FOR_STUDIO})(${params.timeoutMs || 24 * 3600_000})`
  );
  const studioErrors = await page.evaluate<string[]>(STUDIO_ERRORS);
  const view = await page.evaluate<string | null>(
    `document.documentElement.getAttribute("data-studio-view")`
  );
  await fs.mkdir(path.dirname(params.out), { recursive: true });
  await page.screenshot({ path: params.out, fullPage: true });
  return {
    out: params.out,
    ...(await pngSize(params.out)),
    view: view ?? params.view,
    studioErrors,
    consoleErrors,
    timedOut: answer.timedOut,
  };
}

export async function renderToPng(params: RenderParams): Promise<RenderResult> {
  const puppeteer = await loadPuppeteer();
  const executablePath = findChrome(params.chromePath);

  // State, settings and recent folders go to a throwaway folder, so renders
  // never touch ~/.squiggle-studio (#48).
  const stateDir = await fs.mkdtemp(path.join(os.tmpdir(), "studio-render-"));
  try {
    const server = await startStudioServer({
      root: params.root,
      port: params.port ?? 0,
      strictPort: params.port !== undefined,
      allowOpenFolder: false,
      trackRecent: false,
      stateDir,
      recentFile: path.join(stateDir, "recent.json"),
      hubUrl: params.hubUrl,
    });
    try {
      const browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: ["--no-first-run", "--no-default-browser-check"],
      });
      try {
        return await capture(
          browser,
          `${server.url}/${renderSearch(params)}`,
          params
        );
      } finally {
        await browser.close();
      }
    } finally {
      await server.close();
    }
  } finally {
    await fs.rm(stateDir, { recursive: true, force: true });
  }
}
