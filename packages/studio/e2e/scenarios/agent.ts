import type { Permission } from "puppeteer-core";

import { runStudioFile } from "../../src/server/runner.js";
import {
  isAvailableOnHost,
  STUDIO_COMMANDS,
} from "../../src/shared/commands/index.js";
import { TID } from "../../src/shared/testIds.js";
import { expect } from "../lib/expect.js";
import type { Harness, Scenario } from "../lib/harness.js";

// In-page agent features (WP8, spec §6.5): Run ▸ Copy for Agent and
// window.squiggleStudio. Selects by test id and command id.

const CLIPBOARD: Permission[] = [
  "clipboard-read",
  "clipboard-write",
  "clipboard-sanitized-write",
];

type ListedCommand = {
  id: string;
  title: string;
  category: string;
  keys: string[];
  enabled: boolean;
  checked?: boolean;
};
type RunResult = { ok: true } | { ok: false; error: string };
type AgentWindow = Window & {
  squiggleStudio?: {
    commands: {
      list(): ListedCommand[];
      run(id: string, args?: unknown): Promise<RunResult>;
    };
    getRunJson(): unknown;
  };
};

async function grantClipboard(h: Harness): Promise<void> {
  await h.page.browserContext().overridePermissions(h.url, CLIPBOARD);
  await h.page.bringToFront();
}

async function readClipboard(h: Harness): Promise<string> {
  return h.page.evaluate(() => navigator.clipboard.readText());
}

// Runs a command through window.squiggleStudio and returns what it copied.
async function copyWith(h: Harness, id: string): Promise<string> {
  await h.page.evaluate(() => navigator.clipboard.writeText(""));
  await h.command(id);
  return readClipboard(h);
}

async function toastText(h: Harness): Promise<string> {
  const toast = await h.byTestId(TID.toast, {
    "data-toast-type": "confirmation",
  });
  return toast.evaluate((el) => el.textContent ?? "");
}

// RunJson without timeMs (which differs between runs), with numbers rounded
// to 9 significant digits: Node's and Chrome's V8 can differ in the last bit
// of a sample statistic (e2e/parity.e2e.test.ts compares with a tolerance).
function comparable(json: object | null): unknown {
  const round = (value: unknown): unknown => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? Number(value.toPrecision(9)) : value;
    }
    if (Array.isArray(value)) return value.map(round);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value)
          .filter(([key]) => key !== "timeMs")
          .map(([key, v]) => [key, round(v)])
      );
    }
    return value;
  };
  return round(json);
}

const RV_FILE = "rv/minimal.squiggle";

// The address bar without the harness's URL flags (`test=1`), which a
// copied link leaves out.
function addressBarLink(h: Harness): Promise<string> {
  return h.page.evaluate(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("test");
    return url.toString();
  });
}

export const scenarios: Scenario[] = [
  {
    id: "agent/copy-context",
    title: "Run ▸ Copy for Agent ▸ Context copies the §6.5 block",
    tags: ["agent"],
    viewport: { width: 1280, height: 800 },
    state: { file: RV_FILE },
    steps: async (h) => {
      await grantClipboard(h);
      const text = await copyWith(h, "squiggle.agent.copyContext");
      await h.page.evaluate(
        (copied: string) =>
          ((window as Window & { __copied?: string }).__copied = copied),
        text
      );
      expect(await toastText(h)).toContain("Copied context for your agent");
      await h.shot("agent-copy-context");
    },
    check: async (h) => {
      const text = await h.page.evaluate(
        () => (window as Window & { __copied?: string }).__copied ?? ""
      );
      const lines = text.split("\n");
      const abs = `${h.root}/${RV_FILE}`;
      expect(lines[0]).toMatch(
        /^Squiggle Studio — rv\/minimal\.squiggle → Relative values/
      );
      expect(lines).toContain(`Root: ${h.root}`);
      // The link is the address bar, which mirrors the shown view (§2.4).
      const link = lines.find((l) => l.startsWith("Link: "))?.slice(6);
      expect(link).toBe(await addressBarLink(h));
      const params = new URL(link ?? "").searchParams;
      expect(params.get("file")).toBe(RV_FILE);
      expect(params.get("view")).toBe("relative-values");
      expect(lines).toContain(
        `Run: squiggle-studio run ${abs} --root ${h.root} --json`
      );
      const render = lines.find((l) => l.startsWith("Render: "));
      expect(render).toMatch(
        new RegExp(
          `^Render: squiggle-studio render ${abs.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")} --root \\S+ --view relative-values`
        )
      );
      const status = lines.find((l) => l.startsWith("Status: "));
      expect(status).toBeDefined();
      // The run's status and the spec come from the active-run store.
      expect(status).toMatch(/^Status: ok \(\d+ ms\), 0 errors$/);
      expect(lines[0]).toContain("(spec fruit, 3 items)");
      expect(text).not.toContain("Unsaved edits");
    },
  },
  {
    id: "agent/copy-commands",
    title: "Copy for Agent: link, run and render commands",
    tags: ["agent"],
    viewport: { width: 1280, height: 800 },
    state: { file: "imports/main.squiggle", view: "output" },
    check: async (h) => {
      await grantClipboard(h);
      const abs = `${h.root}/imports/main.squiggle`;
      // The address bar: the file, its view and the view's in-file state.
      const link = await copyWith(h, "squiggle.copyViewLink");
      expect(link).toBe(await addressBarLink(h));
      expect(link).toBe(
        `${h.url}/?file=imports%2Fmain.squiggle&view=output&layout=cards&code=1`
      );
      expect(await copyWith(h, "squiggle.agent.copyRunCommand")).toBe(
        `squiggle-studio run ${abs} --root ${h.root} --json`
      );
      expect(await copyWith(h, "squiggle.agent.copyRenderCommand")).toBe(
        `squiggle-studio render ${abs} --root ${h.root}`
      );
    },
  },
  {
    id: "agent/window-api",
    title: "window.squiggleStudio: commands.list, commands.run and getState",
    tags: ["agent"],
    viewport: { width: 1280, height: 800 },
    state: { file: "values/numbers.squiggle" },
    check: async (h) => {
      const listed = await h.page.evaluate(
        () => (window as AgentWindow).squiggleStudio?.commands.list() ?? []
      );
      // Every command of the web host, once, with its manifest title.
      const expected = STUDIO_COMMANDS.filter((c) =>
        isAvailableOnHost(c, "web")
      );
      expect(listed.map((c) => c.id).sort()).toEqual(
        expected.map((c) => c.id).sort()
      );
      for (const command of listed) {
        const spec = expected.find((c) => c.id === command.id);
        expect(command.title).toBe(spec?.title);
        expect(command.category).toBe(spec?.category);
        expect(Array.isArray(command.keys)).toBe(true);
      }
      const byId = new Map(listed.map((c) => [c.id, c]));
      for (const id of [
        "squiggle.agent.copyContext",
        "squiggle.copyViewLink",
        "squiggle.agent.copyRunCommand",
        "squiggle.agent.copyRenderCommand",
      ]) {
        expect(byId.get(id)?.enabled, `${id} is enabled`).toBe(true);
      }
      // No problems in this file: Copy Problems is disabled.
      expect(byId.get("squiggle.agent.copyProblems")?.enabled).toBe(false);

      // commands.run: ok, unknown and disabled.
      await grantClipboard(h);
      const results = await h.page.evaluate(async () => {
        const commands = (window as AgentWindow).squiggleStudio?.commands;
        if (!commands) throw new Error("window.squiggleStudio is missing");
        return {
          ok: await commands.run("squiggle.agent.copyRunCommand"),
          unknown: await commands.run("no.such.command"),
          disabled: await commands.run("squiggle.agent.copyProblems"),
        };
      });
      expect(results.ok).toEqual({ ok: true });
      expect(results.unknown).toEqual({ ok: false, error: "unknown command" });
      expect(results.disabled).toMatchObject({ ok: false });
      expect(results.disabled.ok ? "" : results.disabled.error).toMatch(
        /^disabled/
      );

      // getState matches the screen.
      const state = await h.state();
      const screen = await h.page.evaluate(() => ({
        activeFile: document.documentElement.getAttribute(
          "data-studio-active-file"
        ),
        title: document.title,
        search: location.search,
        explorer: document.querySelector("[data-testid='explorer']") !== null,
        statusbar: document.querySelector("[data-testid='statusbar']") !== null,
      }));
      expect(state.file).toBe("values/numbers.squiggle");
      expect(screen.activeFile).toBe(state.file);
      expect(screen.title.startsWith(`${state.file} — `)).toBe(true);
      expect(new URLSearchParams(screen.search).get("view")).toBe(state.view);
      expect(state.root).toBe(h.root);
      expect(state.host).toBe("web");
      expect(state.dirtyFiles).toEqual([]);
      expect(state.shellLayout.sidebarVisible).toBe(screen.explorer);
      expect(state.shellLayout.statusBarVisible).toBe(screen.statusbar);
    },
  },
  {
    id: "agent/run-json",
    title: "getRunJson() equals `run --json` minus timeMs",
    tags: ["agent", "needs:WP5"],
    viewport: { width: 1280, height: 800 },
    state: { file: "imports/main.squiggle" },
    check: async (h) => {
      const fromPage = (await h.page.evaluate(() =>
        (window as AgentWindow).squiggleStudio?.getRunJson()
      )) as object | null;
      expect(fromPage, "getRunJson() has the shown file's run").not.toBeNull();
      const node = await runStudioFile({
        root: h.root,
        path: "imports/main.squiggle",
      });
      expect(comparable(fromPage)).toEqual(comparable(node.json));

      await grantClipboard(h);
      const copied = JSON.parse(
        await copyWith(h, "squiggle.output.copyJson")
      ) as object;
      expect(comparable(copied)).toEqual(comparable(node.json));
    },
  },
];
