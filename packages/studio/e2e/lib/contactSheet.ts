import fs from "node:fs/promises";

import { sharedBrowser } from "./harness.js";

// A labelled N-column grid of screenshots, rendered in the harness's Chrome,
// so a few images show every state of an e2e:shoot run. Thumbnails keep each
// shot's aspect ratio up to a 16:10 frame; taller shots (embed pages) are
// cropped to their top, and the label gives the full size.
//
// Long runs are split into pages of `perPage` shots: contact-sheet.png, then
// contact-sheet-2.png, … (Chrome repeats content in screenshots taller than
// about 16000 px, and a reader downscales tall images anyway).

export type ContactSheetEntry = {
  png: string; // absolute path
  label: string; // e.g. "03 smoke/start"
  detail?: string; // e.g. the title, or "2 page errors"
  failed?: boolean; // drawn with a red frame
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// PNG width and height from the IHDR chunk.
function pngSize(data: Buffer): { width: number; height: number } {
  if (data.length < 24 || data.toString("ascii", 12, 16) !== "IHDR") {
    throw new Error("Not a PNG file");
  }
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

// The path of page `index` (0-based): out, then out with -2, -3, … before
// the extension.
export function contactSheetPage(out: string, index: number): string {
  return index === 0 ? out : out.replace(/(\.png)?$/, `-${index + 1}.png`);
}

// Writes the pages and resolves to their paths.
export async function renderContactSheet(opts: {
  entries: ContactSheetEntry[];
  out: string; // PNG path of the first page
  title?: string;
  columns?: number; // default 3
  thumbWidth?: number; // default 480 px
  perPage?: number; // default 24 shots (8 rows of 3)
}): Promise<string[]> {
  const perPage = opts.perPage ?? 24;
  const pages: ContactSheetEntry[][] = [];
  for (let i = 0; i < opts.entries.length; i += perPage) {
    pages.push(opts.entries.slice(i, i + perPage));
  }
  if (pages.length === 0) pages.push([]);
  const written: string[] = [];
  for (const [index, entries] of pages.entries()) {
    const out = contactSheetPage(opts.out, index);
    const title =
      pages.length > 1
        ? `${opts.title ?? "Contact sheet"} (page ${index + 1} of ${pages.length})`
        : opts.title;
    await renderPage({ ...opts, entries, out, title });
    written.push(out);
  }
  return written;
}

async function renderPage(opts: {
  entries: ContactSheetEntry[];
  out: string;
  title?: string;
  columns?: number;
  thumbWidth?: number;
}): Promise<void> {
  const columns = opts.columns ?? 3;
  const thumbWidth = opts.thumbWidth ?? 480;
  const frameHeight = Math.round(thumbWidth * 0.625);
  const gap = 16;

  const cells = await Promise.all(
    opts.entries.map(async (entry) => {
      const data = await fs.readFile(entry.png);
      const size = pngSize(data);
      return `
        <figure class="${entry.failed ? "failed" : ""}">
          <div class="frame"><img src="data:image/png;base64,${data.toString("base64")}"></div>
          <figcaption>
            <b>${escapeHtml(entry.label)}</b>
            <span>${escapeHtml(entry.detail ?? "")}</span>
            <i>${size.width}×${size.height}</i>
          </figcaption>
        </figure>`;
    })
  );

  const width = columns * thumbWidth + (columns + 1) * gap;
  const html = `<!doctype html>
    <html><head><meta charset="utf-8"><style>
      * { box-sizing: border-box; }
      body { margin: 0; padding: ${gap}px; background: #e2e8f0; color: #0f172a;
             font: 12px/1.35 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; width: ${width}px; }
      h1 { margin: 0 0 ${gap}px; font-size: 15px; }
      .grid { display: grid; grid-template-columns: repeat(${columns}, ${thumbWidth}px); gap: ${gap}px; }
      figure { margin: 0; background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; }
      figure.failed { border: 3px solid #dc2626; }
      .frame { height: ${frameHeight}px; overflow: hidden; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
      .frame img { display: block; width: 100%; }
      figcaption { padding: 6px 8px; display: flex; gap: 8px; align-items: baseline; }
      figcaption span { flex: 1; color: #475569; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      figcaption i { color: #475569; font-style: normal; }
    </style></head><body>
      ${opts.title ? `<h1>${escapeHtml(opts.title)}</h1>` : ""}
      <div class="grid">${cells.join("")}</div>
    </body></html>`;

  const browser = await sharedBrowser();
  const context = await browser.createBrowserContext();
  try {
    const page = await context.newPage();
    await page.setViewport({ width, height: 600, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() =>
      Promise.all([...document.images].map((img) => img.decode()))
    );
    await page.screenshot({
      path: opts.out as `${string}.png`,
      fullPage: true,
    });
  } finally {
    await context.close();
  }
}
