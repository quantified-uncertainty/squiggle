import { runRv } from "../../src/cli/commands/rv.js";
import { TID } from "../../src/shared/testIds.js";
import { expect } from "../lib/expect.js";
import type { Harness, Scenario } from "../lib/harness.js";

// Relative values view (WP6, spec §10.10): the toolbar in the editor header,
// the List / Grid / Plot views, the evaluator swap while typing (#15), the
// URL as initial state (#17), live reloads (#28), the pair sidebar at narrow
// widths (#29), invalid specs (#30), zero ratios (#46), embed markers (#47),
// and the matrix for agents (getRvMatrix, Copy as CSV) with the same numbers
// as `squiggle-studio rv`. Selectors are test ids, roles and data attributes.

const byId = (id: string, attrs: Record<string, string> = {}) =>
  `[data-testid='${id}']` +
  Object.entries(attrs)
    .map(([k, v]) => `[${k}=${JSON.stringify(v)}]`)
    .join("");

const RV_VIEW = byId(TID.rvView);
const EDITOR_HEADER = byId(TID.editorHeader);
const PAIR_SIDEBAR = byId(TID.rvPairSidebar);

type RvSnapshot = {
  tab: string | null;
  units: string[];
  rows: string[];
  gridCells: number;
  plot: boolean;
  errors: string[];
  picker: string | null;
  url: Record<string, string>;
};

// What the relative values view shows, read in the page.
function snapshot(h: Harness): Promise<RvSnapshot> {
  return h.page.evaluate(
    (ids: {
      tab: string;
      row: string;
      cell: string;
      plot: string;
      error: string;
      picker: string;
    }) => {
      const select = <E extends Element>(sel: string) => [
        ...document.querySelectorAll<E>(sel),
      ];
      const picker = document.querySelector<HTMLSelectElement>(
        `[data-testid='${ids.picker}']`
      );
      return {
        tab:
          document
            .querySelector(`[data-testid='${ids.tab}'][aria-checked='true']`)
            ?.getAttribute("data-tab") ?? null,
        units: select("[data-rv-unit]").map(
          (el) => el.getAttribute("data-rv-unit") ?? ""
        ),
        rows: select(`[data-testid='${ids.row}']`).map(
          (el) => el.getAttribute("data-item") ?? ""
        ),
        gridCells: select(`[data-testid='${ids.cell}']`).length,
        plot: !!document.querySelector(`[data-testid='${ids.plot}']`),
        errors: select(`[data-testid='${ids.error}']`).map(
          (el) => el.textContent ?? ""
        ),
        picker: picker?.value ?? null,
        url: Object.fromEntries(new URLSearchParams(location.search)),
      };
    },
    {
      tab: TID.rvTab,
      row: TID.rvListRow,
      cell: TID.rvGridCell,
      plot: TID.rvPlot,
      error: TID.rvError,
      picker: TID.rvSpecPicker,
    }
  );
}

async function clickTab(h: Harness, tab: string): Promise<void> {
  await (await h.byTestId(TID.rvTab, { "data-tab": tab })).click();
  await h.whenIdle();
}

// Clicks the value cell of a List row (the row itself is display: contents).
async function clickListCell(h: Harness, item: string): Promise<void> {
  const cell = await h.page.waitForSelector(
    `${byId(TID.rvListRow, { "data-item": item })} [data-rv-cell]`,
    { timeout: 5_000 }
  );
  if (!cell) throw new Error(`No List cell for ${item}`);
  await cell.click();
}

// Waits for a condition on the view after an agent edit on disk (the change
// arrives over the live-reload stream), then for idle.
async function waitForRv(
  h: Harness,
  label: string,
  predicate: (s: RvSnapshot) => boolean
): Promise<RvSnapshot> {
  const deadline = Date.now() + 10_000;
  for (;;) {
    const s = await snapshot(h);
    if (predicate(s)) {
      await h.whenIdle();
      return snapshot(h);
    }
    if (Date.now() > deadline) {
      throw new Error(`Timed out waiting for ${label}: ${JSON.stringify(s)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

// Clicks a file's row in the Explorer.
async function clickTreeFile(h: Harness, path: string): Promise<void> {
  const row = await h.page.$(
    `${byId(TID.fileTreeItem)}[data-path=${JSON.stringify(path)}]`
  );
  if (!row) throw new Error(`No Explorer row for ${path}`);
  await row.click();
  await h.whenIdle();
}

type Rect = { left: number; right: number; top: number; bottom: number };

function rectOf(h: Harness, selector: string): Promise<Rect | null> {
  return h.page.evaluate((sel: string) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
  }, selector);
}

const sizes = (
  values: string,
  recommendedUnit: string
) => `// Edited by the e2e scenario rv/unit-change.

sizes = {
  values: {
    ${values}
  },
  recommendedUnit: "${recommendedUnit}",
}
`;

const CLUSTER_ITEMS = [
  "essay",
  "paper",
  "bigPaper",
  "tool",
  "website",
  "library",
];

// The pair sidebar at a narrow width: an overlay drawer that stays inside the
// view and the window, with focus on its close button; Esc closes it (#29).
async function checkSidebar(h: Harness): Promise<void> {
  expect(await h.page.$(".cm-editor"), "the code pane is open").not.toBeNull();
  await clickListCell(h, "paper");
  const sidebar = await h.page.waitForSelector(PAIR_SIDEBAR, {
    timeout: 5_000,
  });
  expect(await sidebar?.evaluate((el) => el.getAttribute("data-mode"))).toBe(
    "drawer"
  );
  const box = await rectOf(h, PAIR_SIDEBAR);
  const view = await rectOf(h, RV_VIEW);
  const width = await h.page.evaluate(() => window.innerWidth);
  expect(box).not.toBeNull();
  expect(view).not.toBeNull();
  if (!box || !view) return;
  expect(box.right).toBeLessThanOrEqual(Math.min(width, view.right) + 1);
  expect(box.left).toBeGreaterThanOrEqual(view.left - 1);
  expect(box.right - box.left).toBeGreaterThan(250);
  const focused = await h.page.evaluate(
    (sel: string) =>
      document.activeElement?.closest(sel) !== null &&
      document.activeElement?.tagName === "BUTTON",
    PAIR_SIDEBAR
  );
  expect(focused, "focus is on the drawer's close button").toBe(true);
  await h.page.keyboard.press("Escape");
  expect(await h.page.$(PAIR_SIDEBAR)).toBeNull();
}

// Opens the sidebar and waits for its charts, for a shot.
async function openSidebarForShot(h: Harness): Promise<void> {
  await clickListCell(h, "paper");
  await h.page.waitForSelector(
    `${PAIR_SIDEBAR} canvas, ${PAIR_SIDEBAR} [data-rv-chart-error]`,
    { timeout: 10_000 }
  );
  await h.whenIdle();
}

const close = (a: number, b: number) =>
  a === b || Math.abs(a - b) <= 1e-9 * Math.max(Math.abs(a), Math.abs(b));

function expectSameValue(a: unknown, b: unknown, where: string): void {
  if (typeof a === "number" && typeof b === "number") {
    expect(close(a, b), `${where}: ${a} vs ${b}`).toBe(true);
  } else if (
    typeof a === "object" &&
    a !== null &&
    typeof b === "object" &&
    b !== null
  ) {
    expect(Object.keys(a).sort(), where).toEqual(Object.keys(b).sort());
    for (const [key, value] of Object.entries(a)) {
      expectSameValue(
        value,
        (b as Record<string, unknown>)[key],
        `${where}.${key}`
      );
    }
  } else {
    expect(a, where).toEqual(b);
  }
}

function expectSamePairs(a: unknown[], b: unknown[]): void {
  expect(a.length).toBe(b.length);
  a.forEach((pair, i) => expectSameValue(pair, b[i], `pairs[${i}]`));
}

function expectSameCsv(a: string, b: string): void {
  const rows = (csv: string) =>
    csv
      .trimEnd()
      .split("\n")
      .map((line) => line.split(","));
  const [ra, rb] = [rows(a), rows(b)];
  expect(ra.length).toBe(rb.length);
  ra.forEach((row, i) =>
    row.forEach((cell, j) => {
      const other = rb[i]?.[j] ?? "";
      const [x, y] = [Number(cell), Number(other)];
      if (cell !== "" && !Number.isNaN(x) && !Number.isNaN(y)) {
        expect(close(x, y), `csv ${i},${j}: ${cell} vs ${other}`).toBe(true);
      } else {
        expect(cell, `csv ${i},${j}`).toBe(other);
      }
    })
  );
}

export const scenarios: Scenario[] = [
  {
    id: "rv/list",
    title: "List: one table per cluster with its unit; tabs in the header",
    tags: ["rv"],
    state: { file: "rv/clusters.squiggle" },
    steps: async (h) => {
      await h.shot("rv-list");
    },
    check: async (h) => {
      const s = await snapshot(h);
      expect(s.tab).toBe("list");
      expect(s.rows.sort()).toEqual([...CLUSTER_ITEMS].sort());
      expect(s.units).toEqual(["essay", "tool"]);
      expect(s.errors).toEqual([]);
      expect(await h.page.$("[data-studio-error]")).toBeNull();
      expect(await h.page.$("[data-rv-computing]")).toBeNull();
      expect(s.url).toMatchObject({
        file: "rv/clusters.squiggle",
        view: "relative-values",
        tab: "list",
        variable: "projects",
      });
      expect((await h.state()).tab).toBe("list");
    },
  },
  {
    id: "rv/grid",
    title: "Grid: every pair, from ?tab=grid",
    tags: ["rv"],
    state: { file: "rv/clusters.squiggle", tab: "grid" },
    steps: async (h) => {
      await h.shot("rv-grid");
    },
    check: async (h) => {
      const s = await snapshot(h);
      expect(s.tab).toBe("grid");
      expect(s.gridCells).toBe(36);
      const cell = await h.page.$(
        byId(TID.rvGridCell, { "data-row": "paper", "data-col": "essay" })
      );
      expect(
        await cell?.evaluate((el) => (el.textContent ?? "").trim().length)
      ).toBeGreaterThan(0);
      expect(await h.page.$("[data-rv-error-cell]")).toBeNull();
    },
  },
  {
    id: "rv/plot",
    title: "Plot: the cluster map and value/uncertainty plots",
    tags: ["rv"],
    state: { file: "rv/clusters.squiggle" },
    steps: async (h) => {
      await clickTab(h, "plot");
      await h.shot("rv-plot");
    },
    check: async (h) => {
      const s = await snapshot(h);
      expect(s.tab).toBe("plot");
      expect(s.plot).toBe(true);
      expect(
        await h.page.$$eval(`${byId(TID.rvPlot)} canvas`, (els) => els.length)
      ).toBeGreaterThanOrEqual(2);
      expect(s.url["tab"]).toBe("plot");
    },
  },
  {
    id: "rv/toolbar-in-header",
    title:
      "Spec picker and List/Grid/Plot sit in the editor header; the dashboard has no own tab bar (#57)",
    tags: ["rv", "layout"],
    state: { file: "rv/two-specs.squiggle" },
    steps: async (h) => {
      await h.shot("rv-toolbar-fruit");
      await h.page.select(byId(TID.rvSpecPicker), "veg");
      await h.whenIdle();
      await h.shot("rv-toolbar-veg");
    },
    check: async (h) => {
      const layout = await h.page.evaluate(
        (ids: {
          header: string;
          picker: string;
          tab: string;
          view: string;
        }) => {
          const header = document.querySelector(
            `[data-testid='${ids.header}']`
          );
          const picker = document.querySelector(
            `[data-testid='${ids.picker}']`
          );
          const tabs = [
            ...document.querySelectorAll(`[data-testid='${ids.tab}']`),
          ];
          const view = document.querySelector(`[data-testid='${ids.view}']`);
          // Buttons named like the tabs anywhere outside the header (the
          // dashboard's own tab bar, when shown).
          const strayTabs = [...document.querySelectorAll("button")].filter(
            (b) =>
              ["List", "Grid", "Plot"].includes((b.textContent ?? "").trim()) &&
              !header?.contains(b)
          ).length;
          return {
            pickerInHeader: !!picker && !!header?.contains(picker),
            pickerClass: picker?.className ?? "",
            pickerWidth: picker?.getBoundingClientRect().width ?? 0,
            tabsInHeader:
              tabs.length === 3 && tabs.every((t) => header?.contains(t)),
            tabRole: tabs[0]?.getAttribute("role"),
            groupRole: tabs[0]?.parentElement?.getAttribute("role"),
            strayTabs,
            selectsInView: view?.querySelectorAll("select").length ?? -1,
          };
        },
        {
          header: TID.editorHeader,
          picker: TID.rvSpecPicker,
          tab: TID.rvTab,
          view: TID.rvView,
        }
      );
      expect(layout.pickerInHeader).toBe(true);
      expect(layout.pickerClass).toContain("form-select");
      expect(layout.pickerWidth).toBeLessThan(240);
      expect(layout.tabsInHeader).toBe(true);
      expect(layout.tabRole).toBe("radio");
      expect(layout.groupRole).toBe("radiogroup");
      expect(layout.strayTabs).toBe(0);
      expect(layout.selectsInView).toBe(0);

      const s = await snapshot(h);
      expect(s.picker).toBe("veg");
      expect(s.rows).toEqual(["carrot", "leek", "pumpkin", "kale"]);
      expect(s.units).toEqual(["carrot"]);
      expect(s.url["variable"]).toBe("veg");

      // The view's focuser: F6 from the code editor lands on the tabs.
      await h.page.click(".cm-content");
      await h.key("F6");
      const active = await h.page.evaluate(() => ({
        testId: document.activeElement?.getAttribute("data-testid"),
        tab: document.activeElement?.getAttribute("data-tab"),
      }));
      expect(active).toEqual({ testId: TID.rvTab, tab: "list" });

      // squiggle.rv.setTab (View ▸ Relative Values Tab).
      await h.command("squiggle.rv.setTab", { tab: "grid" });
      await h.whenIdle();
      expect((await snapshot(h)).tab).toBe("grid");
      await expect(
        h.command("squiggle.rv.setTab", { tab: "table" })
      ).rejects.toThrow(/needs \{tab/);
    },
  },
  {
    id: "rv/large-typing",
    title:
      "Typing in a comment of a 120-item catalog: no long task over 200 ms, no recomputation (#15)",
    tags: ["rv", "perf"],
    state: { file: "rv/large-120.squiggle" },
    check: async (h) => {
      expect((await snapshot(h)).rows.length).toBe(120);
      await h.page.evaluate(() => {
        const w = window as Window & {
          __rvLongTasks?: number[];
          __rvComputing?: number;
        };
        w.__rvLongTasks = [];
        w.__rvComputing = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            w.__rvLongTasks?.push(Math.round(entry.duration));
          }
        }).observe({ type: "longtask" });
        new MutationObserver(() => {
          if (document.querySelector("[data-rv-computing]")) {
            w.__rvComputing = (w.__rvComputing ?? 0) + 1;
          }
        }).observe(document.body, { childList: true, subtree: true });
      });
      // The end of the first line, a comment.
      await h.page.click(".cm-content .cm-line");
      await h.page.keyboard.press("End");
      await h.page.keyboard.type(" typing in a comment", { delay: 120 });
      await h.whenIdle();
      const measured = await h.page.evaluate(() => {
        const w = window as Window & {
          __rvLongTasks?: number[];
          __rvComputing?: number;
        };
        return { longTasks: w.__rvLongTasks ?? [], computing: w.__rvComputing };
      });
      expect(
        measured.longTasks.filter((ms) => ms > 200),
        `long tasks: ${measured.longTasks.join(", ")} ms`
      ).toEqual([]);
      expect(measured.computing, "pairs were recomputed").toBe(0);
      expect((await snapshot(h)).rows.length).toBe(120);
    },
  },
  {
    id: "rv/value-edit-swaps",
    title:
      "A value edit swaps the evaluator after a pause, keeping the shown one meanwhile (#15)",
    tags: ["rv"],
    state: { file: "rv/minimal.squiggle" },
    check: async (h) => {
      const median = () =>
        h.page.evaluate(
          (sel: string) => document.querySelector(sel)?.textContent ?? "",
          `${byId(TID.rvListRow, { "data-item": "mango" })} [data-rv-cell]`
        );
      const before = await median();
      // "mango: 2 to 6" → "mango: 2 to 60"
      let element;
      for (const line of await h.page.$$(".cm-content .cm-line")) {
        const text = await line.evaluate((el) => el.textContent ?? "");
        if (text.includes("mango")) {
          element = line;
          break;
        }
      }
      if (!element) throw new Error("No mango line in the code pane");
      // Record what the List shows while the view isn't ready.
      await h.page.evaluate(
        (cellSelector: string) => {
          const w = window as Window & { __rvWhilePending?: string[] };
          w.__rvWhilePending = [];
          new MutationObserver(() => {
            if (
              document.querySelector(
                "[data-testid='rv-view'] [data-studio-ready='0']"
              )
            ) {
              w.__rvWhilePending?.push(
                document.querySelector(cellSelector)?.textContent ?? ""
              );
            }
          }).observe(document.body, {
            subtree: true,
            childList: true,
            attributes: true,
          });
        },
        `${byId(TID.rvListRow, { "data-item": "mango" })} [data-rv-cell]`
      );
      await element.click();
      await h.page.keyboard.press("End");
      await h.page.keyboard.press("ArrowLeft"); // before the comma
      const typedAt = Date.now();
      await h.page.keyboard.type("0");
      await h.whenIdle();
      const waited = Date.now() - typedAt;
      const whilePending = await h.page.evaluate(
        () =>
          (window as Window & { __rvWhilePending?: string[] })
            .__rvWhilePending ?? []
      );
      // While the swap was pending, the previous dashboard stayed.
      expect(whilePending.length).toBeGreaterThan(0);
      expect(new Set(whilePending)).toEqual(new Set([before]));
      // whenIdle waited for the swap (600 ms after the last run).
      expect(waited).toBeGreaterThanOrEqual(600);
      expect(await median()).not.toBe(before);
      expect(
        await h.page.$("[data-testid='rv-view'] [data-studio-ready='1']")
      ).not.toBeNull();
    },
  },
  {
    id: "rv/unit-change",
    title:
      "List unit follows recommendedUnit until picked, falls back when removed; the sidebar closes (#28)",
    tags: ["rv"],
    state: { file: "rv/unit-change.squiggle" },
    check: async (h) => {
      const file = "rv/unit-change.squiggle";
      expect((await snapshot(h)).units).toEqual(["small"]);

      // An agent changes recommendedUnit: the List follows.
      await h.writeFile(
        file,
        sizes(
          "small: 1, medium: 3 to 6, large: 10 to 30, huge: 50 to 200",
          "medium"
        )
      );
      await waitForRv(h, "unit medium", (s) => s.units[0] === "medium");

      // The user picks a unit: later recommendedUnit changes don't override it.
      await (await h.page.$("[data-rv-compass='large']"))?.click();
      expect((await snapshot(h)).units).toEqual(["large"]);
      await h.writeFile(
        file,
        sizes("small: 1, mid: 3 to 6, large: 10 to 30, huge: 50 to 200", "huge")
      );
      const renamed = await waitForRv(h, "row mid", (s) =>
        s.rows.includes("mid")
      );
      expect(renamed.units).toEqual(["large"]);

      // The picked unit is removed: back to recommendedUnit, and the sidebar
      // of a removed item closes.
      await clickListCell(h, "large");
      expect(await h.page.$(PAIR_SIDEBAR)).not.toBeNull();
      await h.writeFile(
        file,
        sizes("small: 1, mid: 3 to 6, huge: 50 to 200", "mid")
      );
      const removed = await waitForRv(
        h,
        "row large removed",
        (s) => !s.rows.includes("large")
      );
      expect(removed.units).toEqual(["mid"]);
      expect(await h.page.$(PAIR_SIDEBAR)).toBeNull();
      expect(await h.page.$("[data-rv-error-cell]")).toBeNull();
    },
  },
  {
    id: "rv/sidebar-1024",
    title: "Pair sidebar at 1024 px with the code pane open: a drawer (#29)",
    tags: ["rv", "layout"],
    viewport: { width: 1024, height: 768 },
    state: { file: "rv/clusters.squiggle" },
    steps: async (h) => {
      await openSidebarForShot(h);
      await h.shot("rv-sidebar-1024");
      await h.page.keyboard.press("Escape");
    },
    check: checkSidebar,
  },
  {
    id: "rv/sidebar-1280",
    title: "Pair sidebar at 1280 px with the code pane open: a drawer (#29)",
    tags: ["rv", "layout"],
    viewport: { width: 1280, height: 800 },
    state: { file: "rv/clusters.squiggle" },
    steps: async (h) => {
      await openSidebarForShot(h);
      await h.shot("rv-sidebar-1280");
      await h.page.keyboard.press("Escape");
    },
    check: checkSidebar,
  },
  {
    id: "rv/sidebar-wide",
    title: "Pair sidebar next to the table when the view is wide (#29)",
    tags: ["rv", "layout"],
    viewport: { width: 1920, height: 1000 },
    state: { file: "rv/clusters.squiggle", code: false },
    steps: async (h) => {
      // Without the code pane (the stub keeps it in localStorage).
      if (await h.page.$(".cm-editor")) {
        await h.key("Meta+Backslash");
        await h.whenIdle();
      }
      await openSidebarForShot(h);
      await h.shot("rv-sidebar-wide");
    },
    check: async (h) => {
      const sidebar = await h.page.$(PAIR_SIDEBAR);
      if (!sidebar) await openSidebarForShot(h);
      const mode = await h.page.$eval(PAIR_SIDEBAR, (el) =>
        el.getAttribute("data-mode")
      );
      const listWidth = await h.page.$eval(
        "[data-rv-list]",
        (el) => el.getBoundingClientRect().width
      );
      expect(listWidth).toBeGreaterThanOrEqual(900);
      expect(mode).toBe("column");
      const box = await rectOf(h, PAIR_SIDEBAR);
      const width = await h.page.evaluate(() => window.innerWidth);
      expect(box?.right ?? Infinity).toBeLessThanOrEqual(width + 1);
    },
  },
  {
    id: "rv/error-cells",
    title: "Failed comparisons are short error cells",
    tags: ["rv"],
    state: { file: "rv/error-cells.squiggle", tab: "grid" },
    steps: async (h) => {
      await h.shot("rv-error-cells");
    },
    check: async (h) => {
      const errors = await h.page.$$eval("[data-rv-error-cell]", (els) =>
        els.map((el) => (el.textContent ?? "").trim())
      );
      // The broken row and column: 4 + 4 - 1 cells.
      expect(errors).toHaveLength(7);
      for (const error of errors) {
        expect(error).toMatch(/No estimate for broken/);
        expect(error.length).toBeLessThan(200);
      }
      expect(await h.page.$("[data-studio-error]")).toBeNull();
    },
  },
  {
    id: "rv/computing",
    title: "A large catalog shows its computing progress, then the Plot",
    tags: ["rv"],
    state: { file: "rv/minimal.squiggle" },
    steps: async (h) => {
      // A fresh page: no pairs cached yet.
      await h.page.goto(
        // Plot needs all 14,400 pairs (and draws them cheaply on canvases).
        `${h.url}/?file=rv%2Flarge-120.squiggle&view=relative-values&tab=plot&test=1`,
        { waitUntil: "load" }
      );
      await h.page.waitForSelector(
        "[data-rv-computing]:not(.invisible)[aria-valuenow]",
        { timeout: 10_000 }
      );
      await h.shot("rv-computing");
      await h.whenIdle();
    },
    check: async (h) => {
      expect(await h.page.$("[data-rv-computing]")).toBeNull();
      expect((await snapshot(h)).plot).toBe(true);
    },
  },
  {
    id: "rv/invalid-spec-keeps-tab",
    title:
      "An invalid spec keeps the view and shows its validation message (#30)",
    tags: ["rv"],
    state: { file: "rv/invalid-spec.squiggle" },
    steps: async (h) => {
      await h.shot("rv-invalid-spec");
    },
    check: async (h) => {
      const s = await snapshot(h);
      expect(await h.page.$(RV_VIEW)).not.toBeNull();
      expect(s.url["view"]).toBe("relative-values");
      expect(s.errors.join(" ")).toContain(
        "values.kiwi must be a distribution or a number, got String"
      );

      // Live: a valid spec gets a string value, then stops being a spec, then
      // comes back. The view stays throughout.
      const file = "rv/minimal.squiggle";
      await h.open({ file });
      expect((await snapshot(h)).rows).toEqual(["apple", "banana", "mango"]);
      await h.writeFile(
        file,
        `fruit = { values: { apple: 1, banana: 0.5 to 2, mango: "two to six" } }\n`
      );
      const broken = await waitForRv(h, "validation error", (x) =>
        x.errors.some((e) => e.includes("values.mango"))
      );
      expect(broken.rows).toEqual([]);
      expect(await h.page.$(RV_VIEW)).not.toBeNull();

      await h.writeFile(file, "fruit = 3\n");
      await waitForRv(h, "no longer a spec", (x) =>
        x.errors.some((e) => e.includes("no longer a relative values spec"))
      );
      expect(await h.page.$(RV_VIEW)).not.toBeNull();

      await h.writeFile(
        file,
        "fruit = { values: { apple: 1, banana: 0.5 to 2, mango: 2 to 6 } }\n"
      );
      const back = await waitForRv(
        h,
        "dashboard back",
        (x) => x.rows.length > 0
      );
      expect(back.rows).toEqual(["apple", "banana", "mango"]);
      expect(back.errors).toEqual([]);
    },
  },
  {
    id: "rv/zero-ratio",
    title: "A zero ratio shows as a value, not a validation dump (#46)",
    tags: ["rv"],
    state: { file: "rv/zero-ratio.squiggle" },
    steps: async (h) => {
      await h.shot("rv-zero-ratio");
    },
    check: async (h) => {
      const text = (sel: string) =>
        h.page.$eval(sel, (el) => (el.textContent ?? "").trim());
      const s = await snapshot(h);
      expect(s.units).toEqual(["one"]);
      const nothing = await text(
        `${byId(TID.rvListRow, { "data-item": "nothing" })} [data-rv-cell]`
      );
      expect(nothing).toMatch(/^0/);
      expect(nothing).not.toMatch(/invalid|nan|Expected number/i);
      expect(await h.page.$("[data-rv-error-cell]")).toBeNull();

      await clickTab(h, "grid");
      const cell = await text(
        byId(TID.rvGridCell, { "data-row": "nothing", "data-col": "some" })
      );
      expect(cell).toMatch(/^0/);
      expect(cell).not.toMatch(/invalid|nan/i);
    },
  },
  {
    id: "rv/url-tab-initial-only",
    title:
      "?tab= and ?variable= are initial state for the ?file= file only (#17)",
    tags: ["rv"],
    state: { file: "rv/minimal.squiggle", tab: "grid" },
    check: async (h) => {
      let s = await snapshot(h);
      expect(s.tab).toBe("grid");
      expect(s.gridCells).toBe(9);
      expect(s.url["tab"]).toBe("grid");

      await clickTab(h, "list");
      s = await snapshot(h);
      expect(s.tab).toBe("list");
      expect(s.url["tab"]).toBe("list");

      // Another file gets its own (default) tab, not the URL's.
      await clickTreeFile(h, "rv/clusters.squiggle");
      s = await snapshot(h);
      expect(s.url["file"]).toBe("rv/clusters.squiggle");
      expect(s.tab).toBe("list");
      await clickTab(h, "plot");

      // Back: the user's choice, not the URL's grid.
      await clickTreeFile(h, "rv/minimal.squiggle");
      s = await snapshot(h);
      expect(s.tab).toBe("list");
      expect(s.url["tab"]).toBe("list");
      await clickTreeFile(h, "rv/clusters.squiggle");
      expect((await snapshot(h)).tab).toBe("plot");

      // A reload restores the current view from the address bar.
      await h.page.reload({ waitUntil: "load" });
      await h.whenIdle();
      s = await snapshot(h);
      expect(s.url["file"]).toBe("rv/clusters.squiggle");
      expect(s.tab).toBe("plot");
    },
  },
  {
    id: "rv/url-variable-initial-only",
    title: "?variable= picks the initial spec; the picker works after (#17)",
    tags: ["rv"],
    state: { file: "rv/two-specs.squiggle", variable: "veg" },
    check: async (h) => {
      let s = await snapshot(h);
      expect(s.picker).toBe("veg");
      expect(s.units).toEqual(["carrot"]);

      await h.page.select(byId(TID.rvSpecPicker), "fruit");
      await h.whenIdle();
      s = await snapshot(h);
      expect(s.picker).toBe("fruit");
      expect(s.rows).toEqual(["apple", "banana", "mango"]);
      expect(s.url["variable"]).toBe("fruit");

      await clickTreeFile(h, "rv/minimal.squiggle");
      await clickTreeFile(h, "rv/two-specs.squiggle");
      expect((await snapshot(h)).picker).toBe("fruit");
    },
  },
  {
    id: "rv/embed-unknown-variable",
    title: "Embed: an unknown ?variable= is a studio error (#47)",
    tags: ["rv", "embed", "expect:studio-error"],
    query: { embed: "1" },
    state: {
      file: "rv/two-specs.squiggle",
      view: "relative-values",
      variable: "nope",
    },
    check: async (h) => {
      const errors = await h.page.$$eval("[data-studio-error]", (els) =>
        els.map((el) => el.textContent ?? "")
      );
      expect(errors.join(" ")).toMatch(/No relative values spec named nope/);
      expect(errors.join(" ")).toMatch(/fruit, veg/);
    },
  },
  {
    id: "rv/embed-invalid-spec",
    title: "Embed: an invalid spec is a studio error, so render exits 1 (#30)",
    tags: ["rv", "embed"],
    query: { embed: "1" },
    state: { file: "rv/invalid-spec.squiggle", view: "relative-values" },
    check: async (h) => {
      const errors = await h.page.$$eval("[data-studio-error]", (els) =>
        els.map((el) => el.textContent ?? "")
      );
      expect(errors.join(" ")).toContain(
        "values.kiwi must be a distribution or a number, got String"
      );
    },
  },
  {
    id: "rv/embed-tab",
    title: "Embed: ?tab= and ?variable= are authoritative (render --tab)",
    tags: ["rv", "embed"],
    query: { embed: "1" },
    state: {
      file: "rv/two-specs.squiggle",
      view: "relative-values",
      tab: "grid",
      variable: "veg",
    },
    steps: async (h) => {
      await h.shot("rv-embed-grid");
    },
    check: async (h) => {
      const s = await snapshot(h);
      expect(s.gridCells).toBe(16);
      expect(await h.page.$(EDITOR_HEADER)).toBeNull();
      expect(await h.page.$("[data-studio-error]")).toBeNull();
    },
  },
  {
    id: "rv/matrix-for-agents",
    title:
      "getRvMatrix() and Copy as CSV have the numbers of `squiggle-studio rv`",
    tags: ["rv", "agent"],
    state: { file: "rv/clusters.squiggle" },
    check: async (h) => {
      type Bundle = {
        definition: unknown;
        pairs: unknown[];
        meta: Record<string, unknown>;
      };
      const page = await h.page.evaluate(async () => {
        const api = (
          window as Window & {
            squiggleStudio?: {
              getRvMatrix(opts?: { variable?: string }): Promise<unknown>;
            };
          }
        ).squiggleStudio;
        return (await api?.getRvMatrix()) as Bundle | null;
      });
      const cli = await runRv("rv/clusters.squiggle", {}, { cwd: h.root });
      expect(cli.exitCode).toBe(0);
      const node = JSON.parse(cli.stdout) as Bundle;
      expect(page).not.toBeNull();
      expect(page?.definition).toEqual(node.definition);
      // Same numbers, up to the last bits of floating point math (the
      // browser's and Node's Math functions may round differently).
      expectSamePairs(page?.pairs ?? [], node.pairs);
      expect(page?.meta).toMatchObject({
        variableName: "projects",
        seed: "default-seed",
        sampleCount: 1000,
      });

      // Copy for Agent ▸ Relative Values as CSV.
      await h.page.evaluate(() => {
        const w = window as Window & { __copied?: string };
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: (text: string) => {
              w.__copied = text;
              return Promise.resolve();
            },
          },
        });
      });
      await h.command("squiggle.rv.copyCsv");
      const copied = await h.page.evaluate(
        () => (window as Window & { __copied?: string }).__copied
      );
      const csv = await runRv(
        "rv/clusters.squiggle",
        { format: "csv" },
        { cwd: h.root }
      );
      expectSameCsv(copied ?? "", csv.stdout);
      const toast = await h.byTestId(TID.toast);
      expect(await toast.evaluate((el) => el.getAttribute("role"))).toBe(
        "status"
      );

      // Unknown spec: a rejected promise with the specs listed.
      const error = await h.page.evaluate(async () => {
        const api = (
          window as Window & {
            squiggleStudio?: {
              getRvMatrix(opts?: { variable?: string }): Promise<unknown>;
            };
          }
        ).squiggleStudio;
        try {
          await api?.getRvMatrix({ variable: "nope" });
          return "";
        } catch (e) {
          return e instanceof Error ? e.message : String(e);
        }
      });
      expect(error).toMatch(/No relative values spec named "nope".*projects/);
    },
  },
  {
    id: "rv/code-toggle-keeps-filter",
    title: "Toggling the code pane keeps the Grid's cluster filter (#44)",
    tags: ["rv", "needs:WP5"],
    state: { file: "rv/clusters.squiggle" },
    check: async (h) => {
      // The Plot view's cluster filter is the rows filter the Grid uses.
      await clickTab(h, "plot");
      await (await h.page.$("[data-rv-cluster='writing']"))?.click();
      await clickTab(h, "grid");
      const filtered = (await snapshot(h)).gridCells;
      expect(filtered).toBe(3 * 6);
      await h.key("Meta+Backslash");
      await h.whenIdle();
      expect((await snapshot(h)).gridCells).toBe(filtered);
      await h.key("Meta+Backslash");
      await h.whenIdle();
      expect((await snapshot(h)).gridCells).toBe(filtered);
    },
  },
];
