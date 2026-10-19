import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterAll, describe, expect, test } from "vitest";

import { unnamedButtons } from "./lib/a11y.js";
import { checkContrast } from "./lib/contrast.js";
import {
  closeSharedBrowser,
  OUT_DIR,
  type Scenario,
  sanitizeName,
  sharedBrowser,
  startHarnessInternal,
} from "./lib/harness.js";
import { checkInvariants } from "./lib/invariants.js";
import {
  loadScenarios,
  matchesFilter,
  mergedPackages,
  parseList,
  unmetNeeds,
} from "./lib/scenarios.js";
import { runShoot } from "./shoot.js";

// Runs every scenario's steps and checks plus the global invariants
// (lib/invariants.ts). Options come from `pnpm e2e` (e2e/run.ts) as
// environment variables:
//   STUDIO_E2E_ONLY        tags, ids or id prefixes (comma-separated)
//   STUDIO_E2E_SKIP_NEEDS  1: skip scenarios whose `needs:WPn` isn't merged
//   STUDIO_E2E_STRICT      1: contrast violations fail too
//   STUDIO_E2E_MERGED      packages to treat as merged (see lib/scenarios.ts)

const only = parseList(process.env["STUDIO_E2E_ONLY"]);
const skipNeeds = process.env["STUDIO_E2E_SKIP_NEEDS"] === "1";
const strict = process.env["STUDIO_E2E_STRICT"] === "1";
const merged = mergedPackages();

const all = await loadScenarios();
const selected = all.filter((s) => matchesFilter(s, only));

afterAll(async () => {
  await closeSharedBrowser();
});

async function runScenario(scenario: Scenario): Promise<void> {
  const h = await startHarnessInternal(
    {
      fixtures: scenario.fixtures,
      viewport: scenario.viewport,
      query: scenario.query,
    },
    { dir: path.join(OUT_DIR, "test"), prefix: sanitizeName(scenario.id) }
  );
  try {
    await h.open(scenario.state ?? {});
    await scenario.steps?.(h);
    await scenario.check?.(h);
    const report = await checkInvariants(h, { strict });
    for (const warning of report.warnings) {
      process.stderr.write(`[${scenario.id}] warning: ${warning}\n`);
    }
    expect(report.failures, "global invariants").toEqual([]);
  } finally {
    await h.stop();
  }
}

describe("scenarios", () => {
  if (selected.length === 0) {
    test.skip(`no scenario matches ${only.join(", ")}`, () => undefined);
  }
  for (const scenario of selected) {
    const missing = unmetNeeds(scenario, merged);
    const name = `${scenario.id}: ${scenario.title}`;
    if (skipNeeds && missing.length > 0) {
      test.skip(`${name} [needs ${missing.join(", ")}]`, () => undefined);
    } else {
      test(name, () => runScenario(scenario), 120_000);
    }
  }
});

// Self-tests of the harness's own checks, on pages it controls.
describe.skipIf(only.length > 0)("harness", () => {
  async function blankPage(html: string) {
    const browser = await sharedBrowser();
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 1 });
    await page.setContent(html);
    return { page, close: () => context.close() };
  }

  test("contrast check flags slate-400 text and passes slate-500", async () => {
    const { page, close } = await blankPage(`
      <body style="margin:0;background:#fff;font:12px sans-serif">
        <p id="bad" style="color:#94a3b8">Saved</p>
        <p style="color:#64748b">Still readable</p>
        <div style="background:#f8fafc"><span style="color:#94a3b8">On slate-50</span></div>
        <button disabled style="color:#cbd5e1">Disabled is exempt</button>
        <p style="color:#0f172a;opacity:0.3">Faded by opacity</p>
        <p style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);color:#eee">Screen reader only</p>
      </body>`);
    try {
      const report = await checkContrast(page);
      expect(report.violations.map((v) => v.text).sort()).toEqual([
        "Faded by opacity",
        "On slate-50",
        "Saved",
      ]);
      const saved = report.violations.find((v) => v.text === "Saved");
      expect(saved?.ratio).toBeCloseTo(2.56, 1);
    } finally {
      await close();
    }
  });

  test("accessible-name check flags an icon-only button", async () => {
    const { page, close } = await blankPage(`
      <button id="named">Save</button>
      <button aria-label="Close"><svg width="10" height="10"></svg></button>
      <button title="Refresh"><svg width="10" height="10"></svg></button>
      <button id="unnamed"><svg width="10" height="10"></svg></button>
      <button hidden></button>`);
    try {
      const found = await unnamedButtons(page);
      expect(found).toHaveLength(1);
      expect(found[0]).toContain('id="unnamed"');
    } finally {
      await close();
    }
  });

  test("e2e:shoot --strict fails on a page error and writes its outputs", async () => {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), "studio-shoot-"));
    try {
      const throwing: Scenario = {
        id: "selftest/throws",
        title: "A page that throws",
        tags: ["selftest"],
        viewport: { width: 800, height: 500 },
        steps: async (h) => {
          await h.page.evaluate(() => {
            setTimeout(() => {
              throw new Error("Deliberate error (harness self-test)");
            });
          });
          // The pageerror event arrives asynchronously.
          for (let i = 0; i < 100 && h.errors.page.length === 0; i++) {
            await new Promise((resolve) => setTimeout(resolve, 20));
          }
        },
      };
      const fine: Scenario = {
        id: "selftest/fine",
        title: "A page that doesn't throw",
        tags: ["selftest"],
        viewport: { width: 800, height: 500 },
      };
      const strictRun = await runShoot({
        scenarios: [fine, throwing],
        outDir: out,
        label: "strict",
        strict: true,
      });
      expect(strictRun.exitCode).toBe(1);
      const entry = strictRun.manifest.states.find(
        (s) => s.id === "selftest/throws"
      );
      expect(entry?.pageErrors.join("\n")).toContain("Deliberate error");
      const dir = path.join(out, "strict");
      for (const file of [
        "manifest.json",
        "contact-sheet.png",
        "shots/01-selftest-fine.png",
        "shots/02-selftest-throws.png",
        "a11y/selftest-fine.txt",
      ]) {
        expect(fs.existsSync(path.join(dir, file)), file).toBe(true);
      }

      const lenient = await runShoot({
        scenarios: [throwing],
        outDir: out,
        label: "lenient",
        strict: false,
      });
      expect(lenient.exitCode).toBe(0);
    } finally {
      fs.rmSync(out, { recursive: true, force: true });
    }
  });

  test("packages detected as merged", () => {
    expect(merged.has("WP0-H")).toBe(true);
  });

  // The harness's use of WP0's window.squiggleStudio and command log, against
  // stand-ins injected into a real Studio page.
  test("whenIdle, command, state and key use window.squiggleStudio", async () => {
    const h = await startHarnessInternal(
      { viewport: { width: 800, height: 600 } },
      { dir: path.join(OUT_DIR, "test"), prefix: "selftest-agent-hooks" }
    );
    try {
      await h.open({});
      await h.page.evaluate(() => {
        const marker = document.createElement("div");
        marker.id = "selftest-marker";
        marker.setAttribute("data-studio-ready", "0");
        document.body.append(marker);
        const log: Array<{ id: string; source: string; at: number }> = [];
        const run = (id: string) => {
          log.push({ id, source: "api", at: performance.now() });
        };
        Object.assign(window, {
          __studioCommandLog: log,
          squiggleStudio: {
            // Claims idle right away, although the marker says "0".
            whenIdle: async () => ({
              idle: true,
              timedOut: false,
              waitedMs: 0,
            }),
            getState: () => ({
              file: "from/getState.squiggle",
              view: "output",
            }),
            commands: {
              run: async (id: string) => {
                if (id === "bad") return { ok: false, error: "disabled" };
                run(id);
                return { ok: true };
              },
            },
          },
        });
        window.addEventListener("keydown", (e) => {
          if (e.key === "F7") run("one");
          if (e.key === "F8") {
            run("first");
            run("second");
          }
        });
        setTimeout(() => marker.setAttribute("data-studio-ready", "1"), 300);
      });

      await h.whenIdle(5_000);
      expect(h.idleResults.at(-1)?.earlyApi).toBe(true);
      expect(h.idleWarnings).toHaveLength(1);
      expect(
        await h.page.$eval("#selftest-marker", (el) =>
          el.getAttribute("data-studio-ready")
        )
      ).toBe("1");

      await h.page.$eval("#selftest-marker", (el) =>
        el.setAttribute("data-studio-ready", "0")
      );
      await expect(h.whenIdle(300)).rejects.toThrow(/didn't go idle/);
      h.idleTimeouts.length = 0;
      await h.page.$eval("#selftest-marker", (el) => el.remove());

      expect(await h.state()).toEqual({
        file: "from/getState.squiggle",
        view: "output",
      });
      await h.command("fine");
      await expect(h.command("bad")).rejects.toThrow(/disabled/);

      await h.key("F7");
      expect(h.keypressViolations).toEqual([]);
      await h.key("F8");
      expect(h.keypressViolations).toEqual([
        "F8 ran 2 commands: first, second",
      ]);
    } finally {
      await h.stop();
    }
  });
});
