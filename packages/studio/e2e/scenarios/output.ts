import { TID } from "../../src/shared/testIds.js";
import { expect } from "../lib/expect.js";
import type { Harness, Scenario } from "../lib/harness.js";

// Output scenarios (WP5, spec §10.9): narrow panes (#21), cards that survive
// reruns (#22), function cards (#26), long names (#53), all-hidden models
// (#54), one error with ?variable= (#45), compile errors (#61), tall values in
// embed mode (#24) and the ready/error markers render relies on (#25, #47).

const byId = (id: string) => `[data-testid='${id}']`;
const OUTPUT = byId(TID.outputView);
const CARD = byId(TID.outputCard);
const card = (name: string) => `${CARD}[data-variable=${JSON.stringify(name)}]`;
const CODE_PANE = byId(TID.codePane);

type Box = { left: number; right: number; top: number; bottom: number };

async function box(h: Harness, selector: string): Promise<Box | null> {
  return h.page.evaluate((sel: string) => {
    const r = document.querySelector(sel)?.getBoundingClientRect();
    return r
      ? { left: r.left, right: r.right, top: r.top, bottom: r.bottom }
      : null;
  }, selector);
}

async function executionId(h: Harness): Promise<number> {
  return h.page.evaluate(() =>
    Number(document.documentElement.dataset["studioExecutionId"] ?? "0")
  );
}

async function waitForRunAfter(h: Harness, before: number): Promise<void> {
  await h.page.waitForFunction(
    (n: number) =>
      Number(document.documentElement.dataset["studioExecutionId"] ?? "0") > n,
    { timeout: 10_000, polling: 50 },
    before
  );
  await h.whenIdle();
}

// Error alerts (SquiggleErrorAlert) inside the Output view.
async function errorAlerts(h: Harness): Promise<number> {
  return h.page.evaluate(
    (sel: string) =>
      document.querySelectorAll(`${sel} .bg-red-50[role='status']`).length,
    OUTPUT
  );
}

const functionsFile = "output/functions.squiggle";

// The ready / error markers that `render` and agents wait for (§6.5).
async function markers(h: Harness) {
  return h.page.evaluate(() => ({
    ready: [...document.querySelectorAll("[data-studio-ready]")].map((el) =>
      el.getAttribute("data-studio-ready")
    ),
    errors: [...document.querySelectorAll("[data-studio-error]")].map((el) =>
      (el.textContent ?? "").trim()
    ),
  }));
}

// Visible text matching `pattern` in the Output view (the viewer's own
// "simulation #N in N ms" must not show: the status bar has the run, #61).
async function visibleText(h: Harness, pattern: string): Promise<string[]> {
  return h.page.evaluate(
    (sel: string, source: string) => {
      const re = new RegExp(source);
      const root = document.querySelector(sel);
      if (!root) return [];
      return [...root.querySelectorAll<HTMLElement>("*")]
        .filter(
          (el) =>
            [...el.childNodes].some(
              (n) =>
                n.nodeType === Node.TEXT_NODE && re.test(n.textContent ?? "")
            ) && el.checkVisibility()
        )
        .map((el) => el.textContent ?? "");
    },
    OUTPUT,
    pattern
  );
}

export const scenarios: Scenario[] = [
  {
    id: "output/list-layout",
    title:
      "The List layout has no 'simulation #N in N ms' of its own: the status bar shows the run (#61)",
    tags: ["output"],
    state: { file: "values/numbers.squiggle", view: "output", layout: "list" },
    steps: async (h) => {
      await h.shot("output-list");
    },
    check: async (h) => {
      expect(
        await h.page.$eval(OUTPUT, (el) => el.getAttribute("data-layout"))
      ).toBe("list");
      expect(await visibleText(h, "simulation #")).toEqual([]);
    },
  },
  {
    id: "output/embed-list-layout",
    title:
      "render --layout list: no 'simulation #N in N ms', so the PNG is the same every run (#61)",
    tags: ["output", "embed"],
    viewport: { width: 1000, height: 700 },
    query: { embed: "1" },
    state: { file: "values/numbers.squiggle", layout: "list" },
    check: async (h) => {
      expect(
        await h.page.$eval(OUTPUT, (el) => el.getAttribute("data-layout"))
      ).toBe("list");
      expect(await visibleText(h, "simulation #")).toEqual([]);
    },
  },
  {
    id: "output/narrow-720",
    title:
      "At 720 px the code pane starts closed and cards fit the pane, also with the pane open (#21)",
    tags: ["output", "layout"],
    viewport: { width: 720, height: 800 },
    state: { file: "values/numbers.squiggle", view: "output" },
    steps: async (h) => {
      await h.shot("output-narrow-720");
    },
    check: async (h) => {
      const hidden = await h.page.evaluate(
        (sel: string) =>
          document.querySelector(sel)?.closest("[hidden]") !== null,
        CODE_PANE
      );
      expect(hidden, "the code pane starts closed under 760 px").toBe(true);

      const fits = async () => {
        const view = await box(h, OUTPUT);
        const cards = await h.page.$$eval(CARD, (els) =>
          els.map((el) => {
            const r = el.getBoundingClientRect();
            return { left: r.left, right: r.right, width: r.width };
          })
        );
        expect(view).not.toBeNull();
        expect(cards.length).toBeGreaterThan(0);
        for (const c of cards) {
          expect(c.right).toBeLessThanOrEqual((view?.right ?? 0) + 1);
          expect(c.left).toBeGreaterThanOrEqual((view?.left ?? 0) - 1);
        }
        return view;
      };
      await fits();

      // Open the code pane: too narrow for a 240 px editor beside a 360 px
      // view, so the code sits above the view, both full width.
      await h.command("squiggle.toggleCodePane");
      await h.whenIdle();
      const view = await fits();
      const code = await box(h, CODE_PANE);
      const width = (b: Box | null) => (b?.right ?? 0) - (b?.left ?? 0);
      expect(width(code), "a usable editor").toBeGreaterThanOrEqual(400);
      expect(width(view)).toBeGreaterThanOrEqual(400);
      expect(
        view?.top ?? 0,
        "the view is below the code"
      ).toBeGreaterThanOrEqual((code?.bottom ?? 0) - 1);
      expect((code?.bottom ?? 0) - (code?.top ?? 0)).toBeGreaterThan(200);
    },
  },
  {
    id: "output/narrow-900",
    title:
      "At 900 px the code pane sits beside the view: the editor keeps 240 px and the view 360 px (#21)",
    tags: ["output", "layout"],
    viewport: { width: 900, height: 800 },
    state: { file: "values/numbers.squiggle", view: "output", code: true },
    steps: async (h) => {
      await h.shot("output-narrow-900");
    },
    check: async (h) => {
      const code = await box(h, CODE_PANE);
      const view = await box(h, OUTPUT);
      const width = (b: Box | null) => (b?.right ?? 0) - (b?.left ?? 0);
      expect(width(code)).toBeGreaterThanOrEqual(239);
      expect(width(view)).toBeGreaterThanOrEqual(359);
      expect(view?.left ?? 0, "side by side").toBeGreaterThanOrEqual(
        (code?.right ?? 0) - 1
      );
    },
  },
  {
    id: "output/calculator-survives-rerun",
    title: "A calculator input keeps its value when the file reruns (#22)",
    tags: ["output"],
    state: { file: "output/calc.squiggle", view: "output" },
    steps: async (h) => {
      const input = `${card("calc")} input[name='inputs.0']`;
      await h.page.waitForSelector(input, { timeout: 5_000 });
      await h.page.click(input, { clickCount: 3 });
      await h.page.keyboard.type("999");
      await h.whenIdle();
      const before = await executionId(h);
      // An agent changes a comment: the file reruns.
      const disk = await h.readFile("output/calc.squiggle");
      await h.writeFile(
        "output/calc.squiggle",
        disk.replace("// A calculator", "// Still a calculator")
      );
      await waitForRunAfter(h, before);
    },
    check: async (h) => {
      const value = await h.page.$eval(
        `${card("calc")} input[name='inputs.0']`,
        (el) => (el as HTMLInputElement).value
      );
      expect(value).toBe("999");
    },
  },
  {
    id: "output/function-cards",
    title:
      "Function cards show the whole name, fn(…) and Show/Hide plot only for functions the viewer can plot (#26)",
    tags: ["output", "layout"],
    viewport: { width: 1024, height: 768 },
    state: { file: functionsFile, view: "output" },
    steps: async (h) => {
      await h.shot("output-function-cards");
    },
    check: async (h) => {
      const cards = await h.page.$$eval(CARD, (els) =>
        els.map((el) => {
          const name = el.querySelector("span[title]") as HTMLElement | null;
          const sig = el.querySelector("code") as HTMLElement | null;
          const buttons = [...el.querySelectorAll("button")].map(
            (b) => b.textContent ?? ""
          );
          return {
            variable: el.getAttribute("data-variable"),
            type: el.getAttribute("data-value-type"),
            nameTruncated: name ? name.scrollWidth > name.clientWidth : true,
            signature: sig?.textContent ?? "",
            buttons,
          };
        })
      );
      const byName = new Map(cards.map((c) => [c.variable, c]));
      expect(byName.get("oneNumber")).toMatchObject({
        type: "Lambda",
        nameTruncated: false,
        signature: "fn(x)",
        buttons: ["Show plot"],
      });
      expect(byName.get("rangeFn")?.nameTruncated).toBe(false);
      expect(byName.get("multiArg")).toMatchObject({
        signature: "fn(a, b)",
        buttons: [],
      });
      // One parameter, but the viewer can't plot them: no "Show plot" that
      // would only show "Function Display Failed".
      expect(byName.get("scaleDist")).toMatchObject({
        signature: "fn(d)",
        buttons: [],
      });
      expect(byName.get("pair")?.buttons).toEqual([]);
      expect(byName.get("toMonthly")?.nameTruncated).toBe(false);

      // Show plot, then Hide plot.
      const show = await h.page.$(`${card("oneNumber")} button`);
      await show?.click();
      await h.whenIdle();
      const expanded = await h.page.$eval(card("oneNumber"), (el) =>
        [...el.querySelectorAll("button")].map((b) => b.textContent)
      );
      expect(expanded).toContain("Hide plot");
      const hide = await h.page.$$(`${card("oneNumber")} button`);
      for (const b of hide) {
        if ((await b.evaluate((el) => el.textContent)) === "Hide plot") {
          await b.click();
        }
      }
      await h.whenIdle();
      expect(
        await h.page.$eval(card("oneNumber"), (el) =>
          [...el.querySelectorAll("button")].map((b) => b.textContent)
        )
      ).toEqual(["Show plot"]);
    },
  },
  {
    id: "output/long-names",
    title:
      "Long @name titles and identifiers truncate on one line with a tooltip (#53)",
    tags: ["output", "layout"],
    state: { file: "output/long-names.squiggle", view: "output" },
    steps: async (h) => {
      await h.shot("output-long-names");
    },
    check: async (h) => {
      for (const name of [
        "cost",
        "aVeryLongVariableNameThatSomeoneMightActuallyWriteInTheirModelForClarity",
      ]) {
        const title = await h.page.$eval(card(name), (el) => {
          const header = el.querySelector("header");
          const text = header?.querySelector("[title]") as HTMLElement | null;
          const cardRect = el.getBoundingClientRect();
          const r = text?.getBoundingClientRect();
          const lineHeight = text
            ? parseFloat(getComputedStyle(text).lineHeight)
            : 0;
          return {
            title: text?.getAttribute("title") ?? "",
            truncated: text ? text.scrollWidth > text.clientWidth : false,
            oneLine: r ? r.height <= lineHeight * 1.5 : false,
            inside: r ? r.right <= cardRect.right + 1 : false,
          };
        });
        expect(title.title.length).toBeGreaterThan(40);
        expect(title.truncated).toBe(true);
        expect(title.oneLine).toBe(true);
        expect(title.inside).toBe(true);
      }
    },
  },
  {
    id: "output/variable-initial-reveal",
    title:
      "Outside embed mode ?variable= reveals that card once instead of filtering (#17)",
    tags: ["output"],
    state: { file: "values/numbers.squiggle", variable: "uncertainCost" },
    check: async (h) => {
      expect(await h.page.$$(CARD)).toHaveLength(7);
      expect(
        await h.page.evaluate(
          (sel: string) => document.activeElement?.closest(sel) !== null,
          card("uncertainCost")
        )
      ).toBe(true);
    },
  },
  {
    id: "output/all-hidden",
    title: "A model whose variables are all @hide'd says so (#54)",
    tags: ["output"],
    state: { file: "values/all-hidden.squiggle", view: "output" },
    check: async (h) => {
      expect(await h.page.$$(CARD)).toHaveLength(0);
      const text = await h.page.$eval(OUTPUT, (el) => el.textContent ?? "");
      expect(text).toContain("All 3 variables are hidden with @hide.");
      expect(text).not.toContain("doesn't define any variables");
      expect(await h.page.$(byId(TID.layoutToggle))).toBeNull();
    },
  },
  {
    id: "output/variable-error-once",
    title:
      "With ?variable=, a model error shows once, over the dimmed last value (#45)",
    tags: ["output", "embed", "expect:studio-error"],
    viewport: { width: 1000, height: 700 },
    query: { embed: "1" },
    state: { file: "output/var-error.squiggle", variable: "alpha" },
    steps: async (h) => {
      const before = await executionId(h);
      await h.writeFile(
        "output/var-error.squiggle",
        '@name("Alpha")\nalpha = 1 to 2\n\nbeta = alpha * \n'
      );
      await waitForRunAfter(h, before);
      await h.shot("output-variable-error-once");
    },
    check: async (h) => {
      expect(await errorAlerts(h)).toBe(1);
      const dimmed = await h.page.$eval(OUTPUT, (el) => ({
        dimmed: el.querySelector(".opacity-50") !== null,
        caption: (el.textContent ?? "").includes(
          "Showing the last successful run."
        ),
      }));
      expect(dimmed).toEqual({ dimmed: true, caption: true });
    },
  },
  {
    id: "output/compile-error",
    title:
      "A compile error: the run is an error, no Cards/List toggle, no 'Ran in' (#61)",
    tags: ["output", "expect:studio-error"],
    state: { file: "errors/parse-error.squiggle", view: "output" },
    steps: async (h) => {
      await h.shot("output-compile-error");
    },
    check: async (h) => {
      const state = await h.state();
      expect(state.run.status).toBe("error");
      expect(state.run.errors[0]?.kind).toBe("compile");
      expect(await h.page.$(byId(TID.layoutToggle))).toBeNull();
      expect(await h.page.$(byId(TID.outputError))).not.toBeNull();
      const text = await h.page.$eval(OUTPUT, (el) => el.textContent ?? "");
      expect(text).not.toMatch(/Ran in \d+ ms/);
      expect(
        await h.page.evaluate(
          () => document.documentElement.dataset["studioRun"]
        )
      ).toBe("error");
    },
  },
  {
    id: "output/embed-tall-dict",
    title: "In embed mode a long value isn't cut off (#24)",
    tags: ["output", "embed"],
    viewport: { width: 1000, height: 700 },
    query: { embed: "1" },
    state: { file: "output/big-dict.squiggle" },
    check: async (h) => {
      const clipped = await h.page.$eval(card("big"), (el) => {
        const scrollers = [el, ...el.querySelectorAll("div")].filter(
          (d) =>
            d.scrollHeight > d.clientHeight + 1 &&
            getComputedStyle(d).overflowY !== "visible"
        );
        return scrollers.length;
      });
      expect(clipped, "nothing inside the card scrolls or clips").toBe(0);
      const last = await h.page.$eval(card("big"), (el) => {
        const headers = [...el.querySelectorAll("header")];
        const key34 = headers.find((x) => x.textContent?.includes("key34"));
        const r = key34?.getBoundingClientRect();
        const c = el.getBoundingClientRect();
        return r ? r.bottom <= c.bottom + 1 : false;
      });
      expect(last, "key34 is inside the card").toBe(true);
    },
  },
  {
    // Few navigations per page, so the page never nears Chrome's limit of
    // six connections per origin (#14).
    id: "output/embed-markers",
    title:
      "Embed mode: a file that can't open, a text file and the Playground carry ready/error markers (#25)",
    tags: ["output", "embed", "expect:studio-error"],
    viewport: { width: 1000, height: 700 },
    query: { embed: "1" },
    state: { file: "values/no-such-file.squiggle" },
    check: async (h) => {
      let m = await markers(h);
      expect(m.ready).toContain("1");
      expect(m.errors.join(" ")).toContain("values/no-such-file.squiggle");

      await h.open({ file: "text/notes.md" });
      m = await markers(h);
      expect(m.ready).toEqual(["1"]);
      expect(m.errors).toEqual([]);

      await h.open({ file: "values/numbers.squiggle", view: "split" });
      await h.page.waitForSelector("[data-studio-ready='1']", {
        timeout: 15_000,
      });
      m = await markers(h);
      expect(m.errors).toEqual([]);
    },
  },
  {
    id: "output/embed-markers-unavailable",
    title:
      "Embed mode: an unavailable view and an unknown variable are errors (#47)",
    tags: ["output", "embed", "expect:studio-error"],
    viewport: { width: 1000, height: 700 },
    query: { embed: "1" },
    state: { file: "values/numbers.squiggle", view: "relative-values" },
    check: async (h) => {
      let m = await markers(h);
      expect(m.errors.join(" ")).toContain("relative-values");

      await h.open({ file: "values/numbers.squiggle", variable: "nope" });
      m = await markers(h);
      expect(m.errors.join(" ")).toContain("nope");
    },
  },
];
