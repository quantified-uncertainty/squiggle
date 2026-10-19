// Takes screenshots of the example app with headless Chrome, and checks that
// styles don't leak between the app and the dashboards.
//
// Usage: pnpm build && pnpm screenshots
//
// - Screenshots of the production build (`vite preview`).
// - Style isolation checks against the dev server, where each CSS file is a
//   separate <style> element that can be removed: the computed styles of the
//   host page are compared with and without the dashboard stylesheet, and the
//   dashboard's computed styles with and without the host stylesheet.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import puppeteer from "puppeteer-core";
import { createServer, preview } from "vite";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, "screenshots");
fs.mkdirSync(outDir, { recursive: true });

const chromePath = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find((candidate) => candidate && fs.existsSync(candidate));
if (!chromePath) {
  throw new Error("Chrome not found; set CHROME_PATH");
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForDashboard(page) {
  await page.waitForSelector(
    ".squiggle-rv [role='button'], .squiggle-rv button",
    {
      timeout: 60_000,
    }
  );
  await page.waitForFunction(
    () => !document.querySelector("[data-rv-computing]"),
    { timeout: 60_000 }
  );
  await sleep(400);
}

async function clickText(page, selector, text) {
  const handles = await page.$$(selector);
  for (const handle of handles) {
    const content = await handle.evaluate((el) => el.textContent?.trim());
    if (content === text) {
      await handle.click();
      return;
    }
  }
  throw new Error(`No ${selector} with text "${text}"`);
}

async function shot(page, name, options = {}) {
  const file = path.join(outDir, name);
  if (options.fullPage) {
    // Sticky headers render oddly in full-page screenshots of a scrolled page.
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(100);
  }
  await page.screenshot({ path: file, ...options });
  console.log(`  ${path.relative(root, file)}`);
  return file;
}

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--no-first-run", "--no-default-browser-check"],
});

const results = { checks: [] };
const check = (name, ok, details) => {
  results.checks.push({ name, ok, details });
  console.log(
    `${ok ? "PASS" : "FAIL"} ${name}${details ? `: ${details}` : ""}`
  );
};

try {
  // --- Screenshots of the production build ---
  const server = await preview({
    root,
    preview: { port: 4179 },
    logLevel: "error",
  });
  const url = server.resolvedUrls.local[0];
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));

  console.log("Screenshots:");
  await page.goto(`${url}#/live`, { waitUntil: "load" });
  await waitForDashboard(page);
  // onItemClick: item names are buttons.
  await clickText(page, ".squiggle-rv button", "Offline mobile app");
  await page.waitForSelector("[data-selected-item]");
  const selected = await page.$eval(
    "[data-selected-item] strong",
    (el) => el.textContent
  );
  check(
    "onItemClick (live)",
    selected === "Offline mobile app",
    `selected ${selected}`
  );
  await shot(page, "live-list.png", { fullPage: true });

  // Dropdowns render in portals, outside of the dashboard element; they get
  // their own scoped wrapper.
  await clickText(page, ".squiggle-rv button", "Table Settings");
  await page.waitForSelector("[data-floating-ui-portal] .squiggle-rv");
  await sleep(300);
  const portalStyle = await page.$eval(
    "[data-floating-ui-portal] .squiggle-rv > div",
    (el) => {
      const style = getComputedStyle(el);
      return `${style.backgroundColor}, border ${style.borderTopWidth} ${style.borderTopStyle}, radius ${style.borderTopLeftRadius}`;
    }
  );
  check(
    "dropdown portal is styled",
    portalStyle === "rgb(255, 255, 255), border 1px solid, radius 6px",
    portalStyle
  );
  await shot(page, "live-dropdown.png", {
    clip: { x: 0, y: 380, width: 900, height: 420 },
  });
  await page.keyboard.press("Escape");
  await sleep(200);

  // Sidebar with the per-pair Squiggle chart.
  const cells = await page.$$(".squiggle-rv .cursor-pointer .min-h-\\[2em\\]");
  await cells[5].click();
  await page.waitForSelector(".squiggle-rv canvas", { timeout: 30_000 });
  await sleep(1500);
  await shot(page, "live-sidebar.png", { fullPage: true });

  await page.goto(`${url}#/bundle`, { waitUntil: "load" });
  await page.reload({ waitUntil: "load" });
  await waitForDashboard(page);
  await shot(page, "bundle-list.png", { fullPage: true });

  const bundleCells = await page.$$(
    ".squiggle-rv .cursor-pointer .min-h-\\[2em\\]"
  );
  await bundleCells[2].click();
  await sleep(300);
  const sidebarText = await page.$eval(
    ".squiggle-rv",
    (el) => el.textContent ?? ""
  );
  check(
    "bundle sidebar degrades gracefully",
    sidebarText.includes("Distribution charts aren't available"),
    "shows summary numbers and a note instead of charts"
  );
  await shot(page, "bundle-sidebar.png", { fullPage: true });

  await clickText(page, ".squiggle-rv button", "Ranking");
  await page.waitForSelector(".ranking-table");
  await sleep(300);
  await shot(page, "custom-tab.png", { fullPage: true });

  await clickText(page, ".squiggle-rv button", "Grid");
  await sleep(500);
  await shot(page, "bundle-grid.png", { fullPage: true });

  await clickText(page, ".squiggle-rv button", "Plot");
  await sleep(1500);
  await shot(page, "bundle-plot.png", { fullPage: true });

  // renderItemName: links to the app's own pages.
  await clickText(page, ".squiggle-rv button", "List");
  await sleep(300);
  await clickText(page, ".squiggle-rv a", "Partner API");
  await page.waitForFunction(() => location.hash === "#/initiative/partnerApi");
  check("renderItemName links", true, "navigated to #/initiative/partnerApi");
  await sleep(300);
  await shot(page, "initiative-page.png", { fullPage: true });

  // A large live model: the page stays responsive while pairs are computed.
  const measure = async (query) => {
    const largePage = await browser.newPage();
    await largePage.setViewport({ width: 1400, height: 1000 });
    await largePage.evaluateOnNewDocument(() => {
      // Longest gap between timer ticks = how long the page was frozen.
      window.__maxGap = 0;
      let last = performance.now();
      setInterval(() => {
        const now = performance.now();
        window.__maxGap = Math.max(window.__maxGap, now - last);
        last = now;
      }, 20);
    });
    const started = Date.now();
    await largePage.goto(`${url}${query}#/large`, { waitUntil: "load" });
    if (!query) {
      await largePage.waitForSelector("[data-rv-computing]", {
        timeout: 60_000,
      });
      await sleep(300);
      await shot(largePage, "large-progress.png", {
        clip: { x: 0, y: 0, width: 1400, height: 520 },
      });
    }
    await waitForDashboard(largePage);
    const seconds = (Date.now() - started) / 1000;
    const maxGap = await largePage.evaluate(() => window.__maxGap);
    if (!query) {
      await shot(largePage, "large-ready.png");
    }
    await largePage.close();
    return { seconds, maxGap };
  };
  const chunked = await measure("");
  const sync = await measure("?sync");
  check(
    "large model stays responsive",
    chunked.maxGap < 300,
    `120 items, list tab, then all 14,400 pairs in the background: ${chunked.seconds.toFixed(1)}s, longest freeze ${Math.round(chunked.maxGap)}ms (synchronous: ${sync.seconds.toFixed(1)}s for the list tab only, longest freeze ${Math.round(sync.maxGap)}ms)`
  );

  check("no page errors", errors.length === 0, errors.join("; "));
  await page.close();
  await server.close();

  // --- Style isolation, against the dev server ---
  const dev = await createServer({
    root,
    server: { port: 4180 },
    logLevel: "error",
  });
  await dev.listen();
  const devUrl = dev.resolvedUrls.local[0];
  const devPage = await browser.newPage();
  await devPage.setViewport({
    width: 1400,
    height: 1000,
    deviceScaleFactor: 1,
  });

  // All computed properties of elements matching `filter`, in document order.
  const collect = (scope, properties) =>
    devPage.evaluate(
      (scope, properties) => {
        // The wrapper itself is the boundary: it's laid out by the host page
        // (e.g. `className`, or a global `* { box-sizing }` rule), so only
        // the elements inside it count as the dashboard.
        const elements = [...document.body.querySelectorAll("*")].filter(
          (el) =>
            scope === "host"
              ? !el.closest(".squiggle-rv")
              : !!el.parentElement?.closest(".squiggle-rv")
        );
        return elements.map((el) => {
          const style = getComputedStyle(el);
          const names = properties ?? [...style];
          const values = {};
          for (const name of names) {
            values[name] = style.getPropertyValue(name);
          }
          return {
            tag: el.tagName,
            className: String(el.className),
            containsDashboard: !!el.querySelector(".squiggle-rv"),
            values,
          };
        });
      },
      scope,
      properties
    );
  // The dashboard's ancestors get taller or shorter when the dashboard's own
  // styles change; that's layout, not style leakage.
  const geometry = new Set([
    "height",
    "block-size",
    "width",
    "inline-size",
    "perspective-origin",
    "transform-origin",
  ]);
  const diff = (before, after) => {
    const diffs = [];
    before.forEach((element, i) => {
      for (const [name, value] of Object.entries(element.values)) {
        if (element.containsDashboard && geometry.has(name)) {
          continue;
        }
        if (after[i].values[name] !== value) {
          diffs.push(
            `${element.tag}.${element.className} ${name}: ${value} -> ${after[i].values[name]}`
          );
        }
      }
    });
    return diffs;
  };
  const removeStyle = (suffix) =>
    devPage.evaluate((suffix) => {
      const styles = [
        ...document.querySelectorAll("style[data-vite-dev-id]"),
      ].filter((s) => s.getAttribute("data-vite-dev-id").endsWith(suffix));
      styles.forEach((s) => s.remove());
      return styles.length;
    }, suffix);

  // 1. The dashboard stylesheet doesn't change the host page.
  await devPage.goto(`${devUrl}#/live`, { waitUntil: "load" });
  await waitForDashboard(devPage);
  const hostClip = await devPage.evaluate(() => {
    const rect = document.querySelector(".acme-intro").getBoundingClientRect();
    return {
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: Math.ceil(rect.bottom + 16),
    };
  });
  const hostBefore = await collect("host");
  const withCss = fs.readFileSync(
    await shot(devPage, "host-with-dashboard-css.png", { clip: hostClip })
  );
  const removed = await removeStyle("/dist/styles.css");
  await sleep(300);
  const hostAfter = await collect("host");
  const withoutCss = fs.readFileSync(
    await shot(devPage, "host-without-dashboard-css.png", { clip: hostClip })
  );
  const hostDiffs = diff(hostBefore, hostAfter);
  check(
    "dashboard CSS doesn't affect the host page (computed styles)",
    removed === 1 && hostDiffs.length === 0,
    `removed ${removed} stylesheet; compared ${hostBefore.length} host elements x all properties; ${hostDiffs.length} differences ${hostDiffs.slice(0, 5).join(", ")}`
  );
  check(
    "dashboard CSS doesn't affect the host page (pixels)",
    withCss.equals(withoutCss),
    "header + intro screenshots are byte-identical"
  );

  // 2. The host stylesheet doesn't change the dashboard.
  const dashboardProperties = [
    "font-family",
    "font-size",
    "font-weight",
    "font-style",
    "line-height",
    "letter-spacing",
    "text-transform",
    "text-decoration-line",
    "text-align",
    "color",
    "background-color",
    "background-image",
    "border-top-width",
    "border-top-style",
    "border-top-color",
    "border-left-width",
    "border-left-style",
    "border-top-left-radius",
    "box-shadow",
    "padding-top",
    "padding-left",
    "margin-top",
    "margin-left",
    "display",
    "list-style-type",
    "cursor",
    "box-sizing",
  ];
  await devPage.goto(`${devUrl}#/live`, { waitUntil: "load" });
  await devPage.reload({ waitUntil: "load" });
  await waitForDashboard(devPage);
  const dashboardBefore = await collect("dashboard", dashboardProperties);
  const card = await devPage.$(".squiggle-rv");
  await card.screenshot({
    path: path.join(outDir, "dashboard-with-host-css.png"),
  });
  const removedHost = await removeStyle("/src/host.css");
  await sleep(300);
  const dashboardAfter = await collect("dashboard", dashboardProperties);
  await card.screenshot({
    path: path.join(outDir, "dashboard-without-host-css.png"),
  });
  const dashboardDiffs = diff(dashboardBefore, dashboardAfter);
  check(
    "host CSS doesn't affect the dashboard (computed styles)",
    removedHost === 1 && dashboardDiffs.length === 0,
    `compared ${dashboardBefore.length} dashboard elements x ${dashboardProperties.length} properties; ${dashboardDiffs.length} differences ${dashboardDiffs.slice(0, 5).join(", ")}`
  );

  await devPage.close();
  await dev.close();
} finally {
  await browser.close();
}

fs.writeFileSync(
  path.join(outDir, "checks.json"),
  JSON.stringify(results, null, 2) + "\n"
);
if (results.checks.some((c) => !c.ok)) {
  process.exitCode = 1;
}
