import { describe, expect, test } from "vitest";

import {
  type CommandEntry,
  isPaletteCommand,
  OTHER_COMMANDS_GROUP,
  paletteRows,
  pushRecentCommand,
  RECENT_COMMANDS_GROUP,
  RECENT_COMMANDS_STORED,
  rowKey,
} from "../src/client/commands/providers/commands.js";
import {
  CHANGED_GROUP,
  FILES_GROUP,
  MAX_QUICK_OPEN_ROWS,
  quickOpenRows,
  RECENT_GROUP,
  TREE_FILE_CAP,
} from "../src/client/commands/providers/files.js";
import {
  cycleIndex,
  initialSwitcherIndex,
  switcherItems,
} from "../src/client/commands/providers/recent.js";
import type { ChangeEntry } from "../src/client/lib/workspaceTypes.js";
import { getCommand, STUDIO_COMMANDS } from "../src/shared/commands/index.js";

const PATHS = [
  "costs.squiggle",
  "lib/costs.squiggle",
  "main.squiggle",
  "notes.md",
  "rv/fruit.squiggle",
];

const files = (overrides: Partial<Parameters<typeof quickOpenRows>[0]> = {}) =>
  quickOpenRows({
    query: "",
    paths: PATHS,
    mru: [],
    activePath: null,
    externalChanges: {},
    dirtyPaths: new Set(),
    ...overrides,
  });

const change = (at: number, extra: Partial<ChangeEntry> = {}): ChangeEntry => ({
  at,
  exists: true,
  seen: false,
  ...extra,
});

describe("Quick Open: empty query", () => {
  test("Recently opened is the MRU without the shown file, the previous file first", () => {
    const { rows } = files({
      mru: ["main.squiggle", "notes.md", "costs.squiggle"],
      activePath: "main.squiggle",
    });
    expect(rows.map((r) => [r.path, r.group])).toEqual([
      ["notes.md", RECENT_GROUP],
      ["costs.squiggle", RECENT_GROUP],
    ]);
  });

  test("Changed on disk lists unseen, existing changes newest first, after recents", () => {
    const { rows } = files({
      mru: ["main.squiggle", "notes.md"],
      activePath: "main.squiggle",
      externalChanges: {
        "costs.squiggle": change(100),
        "rv/fruit.squiggle": change(300),
        "lib/costs.squiggle": change(200, { seen: true }), // seen
        "gone.squiggle": change(400, { exists: false }), // deleted
        "notes.md": change(500), // already listed as recent
      },
    });
    expect(rows.map((r) => [r.path, r.group])).toEqual([
      ["notes.md", RECENT_GROUP],
      ["rv/fruit.squiggle", CHANGED_GROUP],
      ["costs.squiggle", CHANGED_GROUP],
    ]);
    // The recent row carries the change as a badge.
    expect(rows[0]?.changedAt).toBe(500);
    expect(rows[1]?.changedAt).toBe(300);
  });

  test("MRU entries missing from the tree are skipped", () => {
    const { rows } = files({ mru: ["deleted.squiggle", "notes.md"] });
    expect(rows.map((r) => r.path)).toEqual(["notes.md"]);
  });

  test("with nothing recent, the folder's files are listed", () => {
    const { rows } = files({ activePath: "notes.md" });
    expect(rows.map((r) => r.path)).toEqual([
      "costs.squiggle",
      "lib/costs.squiggle",
      "main.squiggle",
      "rv/fruit.squiggle",
    ]);
    expect(rows.every((r) => r.group === FILES_GROUP)).toBe(true);
  });

  test("dirty files are marked", () => {
    const { rows } = files({
      mru: ["notes.md", "main.squiggle"],
      dirtyPaths: new Set(["main.squiggle"]),
    });
    expect(rows.map((r) => [r.path, r.dirty])).toEqual([
      ["notes.md", false],
      ["main.squiggle", true],
    ]);
  });

  test("an empty folder is reported", () => {
    const result = files({ paths: [] });
    expect(result.rows).toEqual([]);
    expect(result.emptyFolder).toBe(true);
  });
});

describe("Quick Open: query", () => {
  test("folder hints tell same-name files apart (#55)", () => {
    const { rows } = files({ query: "costs" });
    expect(rows.map((r) => [r.path, r.name, r.folder])).toEqual([
      ["costs.squiggle", "costs.squiggle", ""],
      ["lib/costs.squiggle", "costs.squiggle", "lib"],
    ]);
    expect(rows[1]?.positions).toEqual([4, 5, 6, 7, 8]);
    expect(rows.every((r) => r.group === undefined)).toBe(true);
  });

  test("at most 50 rows are rendered; the rest are counted", () => {
    const many = Array.from({ length: 120 }, (_, i) => `m/model-${i}.squiggle`);
    const result = files({ query: "model", paths: many });
    expect(result.rows).toHaveLength(MAX_QUICK_OPEN_ROWS);
    expect(result.hiddenCount).toBe(120 - MAX_QUICK_OPEN_ROWS);
    // The empty-query file list is capped too.
    const empty = files({ paths: many });
    expect(empty.rows).toHaveLength(MAX_QUICK_OPEN_ROWS);
  });

  test("a tree at the server's cap is reported as truncated", () => {
    const capped = Array.from({ length: TREE_FILE_CAP }, (_, i) => `f${i}.md`);
    expect(files({ query: "f1", paths: capped }).truncated).toBe(true);
    expect(files().truncated).toBe(false);
  });
});

// ── The palette ────────────────────────────────────────────────────────────

const entry = (
  id: string,
  extra: Partial<Omit<CommandEntry, "spec">> = {}
): CommandEntry => {
  const spec = getCommand(id);
  if (!spec) throw new Error(`No command ${id}`);
  return { spec, enabled: true, keys: [], ...extra };
};

const palette = (
  commands: CommandEntry[],
  extra: Partial<Parameters<typeof paletteRows>[0]> = {}
) =>
  paletteRows({
    query: "",
    commands,
    views: [],
    recent: [],
    platform: "mac",
    host: "web",
    ...extra,
  });

describe("palette rows", () => {
  test("rows read Category: Title with the host's key, only for enabled commands", () => {
    const rows = palette([
      entry("workbench.action.files.save", { keys: ["⌘S"] }),
      entry("workbench.action.files.saveAll", { enabled: false }),
    ]);
    expect(rows).toEqual([
      expect.objectContaining({
        id: "workbench.action.files.save",
        label: "File: Save",
        keyLabel: "⌘S",
      }),
    ]);
  });

  test("region, main-owned and palette: false commands are never listed", () => {
    for (const id of [
      "list.focusDown",
      "workbench.action.newWindow",
      "squiggle.openFile",
    ]) {
      const spec = getCommand(id);
      expect(spec && isPaletteCommand(spec), id).toBe(false);
    }
    expect(
      palette([entry("list.focusDown"), entry("squiggle.openFile")])
    ).toEqual([]);
  });

  test("toggles show on / off", () => {
    const rows = palette([
      entry("workbench.action.toggleSidebarVisibility", { checked: true }),
      entry("workbench.action.toggleStatusbarVisibility", { checked: false }),
      entry("workbench.action.files.save"),
    ]);
    expect(rows.map((r) => [r.id, r.toggle])).toEqual([
      ["workbench.action.files.save", undefined],
      ["workbench.action.toggleSidebarVisibility", "on"],
      ["workbench.action.toggleStatusbarVisibility", "off"],
    ]);
  });

  test("parameterized commands get one row per value; views follow squiggle.views", () => {
    const rows = palette([entry("squiggle.view.select")], {
      views: [
        { id: "output", label: "Output", available: true },
        { id: "relative-values", label: "Relative values", available: false },
        { id: "split", label: "Playground", available: true },
      ],
    });
    expect(rows.map((r) => [r.label, r.args, r.keyLabel])).toEqual([
      ["View: Show Output", { id: "output" }, "⌘K 1"],
      ["View: Show Playground", { id: "split" }, "⌘K 3"],
    ]);
    expect(
      palette([entry("squiggle.output.setLayout")]).map((r) => r.label)
    ).toEqual(["Output: Show as Cards", "Output: Show as List"]);
    // A browser on Windows shows its own binding.
    const win = palette([entry("squiggle.view.select")], {
      platform: "win",
      views: [{ id: "output", label: "Output", available: true }],
    });
    expect(win[0]?.keyLabel).toBe("Ctrl+K 1");
  });

  test("the 5 most recent come first, the rest alphabetically", () => {
    const ids = [
      "workbench.action.files.save",
      "workbench.action.files.saveAll",
      "workbench.action.toggleSidebarVisibility",
      "workbench.action.toggleStatusbarVisibility",
      "workbench.action.quickOpen",
      "workbench.action.showCommands",
      "squiggle.help.docs",
    ];
    const recent = [
      "squiggle.help.docs",
      "workbench.action.quickOpen",
      "workbench.action.files.saveAll",
      "workbench.action.showCommands",
      "workbench.action.toggleSidebarVisibility",
      "workbench.action.files.save", // the 6th: not shown as recent
    ];
    const rows = palette(
      ids.map((id) => entry(id)),
      { recent }
    );
    expect(rows.slice(0, 5).map((r) => [r.id, r.group])).toEqual(
      recent.slice(0, 5).map((id) => [id, RECENT_COMMANDS_GROUP])
    );
    expect(rows.slice(5).map((r) => [r.label, r.group])).toEqual([
      ["File: Save", OTHER_COMMANDS_GROUP],
      ["View: Toggle Status Bar", OTHER_COMMANDS_GROUP],
    ]);
  });

  test("a query fuzzy-matches the label with highlights, or the id and aliases", () => {
    const commands = STUDIO_COMMANDS.map((spec) => ({
      spec,
      enabled: true,
      keys: [],
    }));
    const rows = palette(commands, { query: "toggle code" });
    expect(rows[0]?.id).toBe("squiggle.toggleCodePane");
    expect(rows[0]?.positions.length).toBe("togglecode".length);
    // "palette" is an alias of Show All Commands…, not in its label.
    const byAlias = palette(commands, { query: "palette" });
    expect(byAlias.map((r) => r.id)).toContain("workbench.action.showCommands");
    expect(
      byAlias.find((r) => r.id === "workbench.action.showCommands")?.positions
    ).toEqual([]);
  });

  test("the palette MRU keeps 20, most recent first, without duplicates", () => {
    let recent: string[] = [];
    for (let i = 0; i < 25; i++) recent = pushRecentCommand(recent, `c${i}`);
    expect(recent).toHaveLength(RECENT_COMMANDS_STORED);
    expect(recent[0]).toBe("c24");
    recent = pushRecentCommand(recent, "c10");
    expect(recent[0]).toBe("c10");
    expect(recent.filter((k) => k === "c10")).toHaveLength(1);
    expect(rowKey("squiggle.view.select", { id: "output" })).toBe(
      'squiggle.view.select {"id":"output"}'
    );
  });
});

// ── The recent-files switcher ──────────────────────────────────────────────

describe("switcher", () => {
  test("lists the shown file first, then the MRU, with the previous one selected", () => {
    const items = switcherItems({
      mru: ["b.squiggle", "a.squiggle", "lib/c.squiggle"],
      activePath: "a.squiggle",
      externalChanges: { "lib/c.squiggle": change(1) },
      dirtyPaths: new Set(["b.squiggle"]),
    });
    expect(
      items.map((i) => [i.path, i.shown, i.dirty, i.changed, i.folder])
    ).toEqual([
      ["a.squiggle", true, false, false, ""],
      ["b.squiggle", false, true, false, ""],
      ["lib/c.squiggle", false, false, true, "lib"],
    ]);
    expect(initialSwitcherIndex(items)).toBe(1);
  });

  test("with nothing shown the first MRU entry is selected", () => {
    const items = switcherItems({
      mru: ["b.squiggle", "a.squiggle"],
      activePath: null,
      externalChanges: {},
      dirtyPaths: new Set(),
    });
    expect(initialSwitcherIndex(items)).toBe(0);
  });

  test("cycling wraps both ways", () => {
    expect(cycleIndex(2, 1, 3)).toBe(0);
    expect(cycleIndex(0, -1, 3)).toBe(2);
    expect(cycleIndex(1, 1, 3)).toBe(2);
    expect(cycleIndex(0, 1, 0)).toBe(0);
  });
});
