import fs from "node:fs";

// Finding and loading a headless browser, shared by `squiggle-studio render`
// and the e2e harness (e2e/lib/harness.ts).

// The subset of the puppeteer-core API that `render` uses. puppeteer-core is
// an optional dependency, so we don't depend on its types at build time.
export type PuppeteerConsoleMessage = { type(): string; text(): string };
export type PuppeteerPage = {
  setViewport(v: {
    width: number;
    height: number;
    deviceScaleFactor?: number;
  }): Promise<void>;
  goto(
    url: string,
    opts: { waitUntil: string; timeout: number }
  ): Promise<unknown>;
  evaluate<T>(expression: string): Promise<T>;
  screenshot(opts: { path: string; fullPage: boolean }): Promise<unknown>;
  on(event: "console", cb: (message: PuppeteerConsoleMessage) => void): void;
  on(event: "pageerror", cb: (error: unknown) => void): void;
  emulateMediaFeatures(
    features: Array<{ name: string; value: string }>
  ): Promise<void>;
};
export type PuppeteerBrowser = {
  newPage(): Promise<PuppeteerPage>;
  close(): Promise<void>;
};
export type Puppeteer = {
  launch(opts: {
    executablePath: string;
    headless: boolean;
    args: string[];
  }): Promise<PuppeteerBrowser>;
};

export const CHROME_CANDIDATES = [
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

// The first existing Chrome/Chromium executable: `explicit` if given, else
// $CHROME_PATH, else the usual install locations.
export function findChrome(explicit?: string): string {
  const candidates = explicit ? [explicit] : CHROME_CANDIDATES;
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  throw new Error(
    "Couldn't find Chrome or Chromium. Install Chrome, or pass --chrome <path> (or set CHROME_PATH)."
  );
}

export async function loadPuppeteer(): Promise<Puppeteer> {
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
