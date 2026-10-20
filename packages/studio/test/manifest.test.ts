// Rules for the command manifest (§4.6, §10.3). CodeMirror's keymaps are
// imported here only (test-only devDependencies); Studio's client never
// imports @codemirror/* (see boundaries.test.ts).
import {
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import {
  defaultKeymap,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { foldKeymap } from "@codemirror/language";
import { searchKeymap } from "@codemirror/search";
import { describe, expect, test } from "vitest";

import {
  evaluateWhen,
  parseWhen,
  whenKeys,
} from "../src/client/commands/when.js";
import {
  BROWSER_RESERVED,
  canonicalKey,
  type CommandSpec,
  EDITOR_BUILTINS,
  getCommand,
  type Host,
  isAvailableOnHost,
  isFunctionKeyStroke,
  isModified,
  type KeyBinding,
  keyForPlatform,
  menuCommandIds,
  type MenuNode,
  parseKey,
  type Platform,
  type Stroke,
  strokeToString,
  STUDIO_COMMANDS,
  STUDIO_MENUS,
} from "../src/shared/commands/index.js";
import { SETTING_KEYS } from "../src/shared/settings.js";

const PLATFORMS: Platform[] = ["mac", "win", "linux"];
const HOSTS: Host[] = ["web", "electron"];

type Entry = {
  spec: CommandSpec;
  binding: KeyBinding;
  key: string; // canonical
  strokes: Stroke[];
};

function entries(platform: Platform, host?: Host): Entry[] {
  return STUDIO_COMMANDS.flatMap((spec) =>
    (spec.keys ?? []).flatMap((binding) => {
      const key = keyForPlatform(binding, platform);
      if (!key) return [];
      if (
        host &&
        (!isAvailableOnHost(binding, host) || !isAvailableOnHost(spec, host))
      ) {
        return [];
      }
      return [
        { spec, binding, key: canonicalKey(key), strokes: parseKey(key) },
      ];
    })
  );
}

// ── Context keys some owner publishes (§4.4) ───────────────────────────────

const PUBLISHED_KEYS = new Set([
  // registry (host.ts)
  "isMac",
  "isWindows",
  "isLinux",
  "isElectron",
  "isWeb",
  "host",
  // focus.ts
  "focusRegion",
  "editorTextFocus",
  "textInputFocus",
  "filesExplorerFocus",
  "overlayOpen",
  "menuOpen", // WP1
  // studioState (settings)
  ...SETTING_KEYS.map((k) => `config.${k}`),
  // WorkspaceCommands (WP4)
  "activeFile",
  "activeFileIsSquiggle",
  "activeFileDirty",
  "activeFileConflict",
  "activeFileDeleted",
  "dirtyCount",
  "recentFileCount",
  "hasExternalChanges",
  "canGoBack",
  "canGoForward",
  "allowOpenFolder",
  "rootChanged",
  "rootMissing",
  "connected",
  // FileWorkspace (WP5)
  "squiggle.view",
  "squiggle.viewCount",
  "squiggle.codePaneVisible",
  "squiggle.viewHasOwnEditor",
  "squiggle.outputLayout",
  "squiggle.views",
  "running",
  "runFinished",
  "hasErrors",
  "autorun",
  // EditorCommands (WP5)
  "hasEditor",
  "hasCodeEditor",
  // RelativeValuesView (WP6)
  "squiggle.rvTab",
  "rvReady",
  // layout store (WP0)
  "sidebarVisible",
  "statusBarVisible",
  "menuBarVisible",
]);

// ── Every command a package's "Registers" list names (§10.5–§10.12) ────────

const REGISTERS: Record<string, string[]> = {
  WP0: [
    "workbench.action.focusNextPart",
    "workbench.action.focusPreviousPart",
    "squiggle.focusMain",
  ],
  WP1: [
    "workbench.action.toggleSidebarVisibility",
    "workbench.action.toggleStatusbarVisibility",
    "workbench.action.toggleMenuBar",
    "squiggle.focusMenuBar",
    "workbench.action.toggleFullScreen",
    "squiggle.help.docs",
    "squiggle.help.relativeValues",
    "squiggle.help.agents",
    "squiggle.help.hub",
    "squiggle.help.reportIssue",
  ],
  "WP1 (Electron main)": [
    "workbench.action.newWindow",
    "workbench.action.files.openFile",
    "workbench.action.closeWindow",
    "workbench.action.quit",
    "workbench.action.zoomIn",
    "workbench.action.zoomOut",
    "workbench.action.zoomReset",
    "workbench.action.toggleDevTools",
    "workbench.action.reloadWindow",
  ],
  WP2: [
    "workbench.action.showCommands",
    "workbench.action.quickOpen",
    "workbench.action.quickOpenPreviousRecentlyUsedEditor",
    "workbench.action.openGlobalKeybindings",
    "squiggle.help.about",
  ],
  WP3: [
    "list.focusUp",
    "list.focusDown",
    "list.expand",
    "list.collapse",
    "list.focusFirst",
    "list.focusLast",
    "list.focusPageUp",
    "list.focusPageDown",
    "explorer.openAndPassFocus",
    "filesExplorer.openFilePreserveFocus",
    "renameFile",
    "explorer.newFile",
    "explorer.newFolder",
    "workbench.view.explorer",
    "workbench.files.action.showActiveFileInExplorer",
    "workbench.files.action.collapseExplorerFolders",
    "squiggle.refreshTree",
    "squiggle.hub.import",
    "workbench.action.files.openFolder",
    "workbench.action.openRecent",
    "squiggle.openRecentFolder",
  ],
  WP4: [
    "workbench.action.files.save",
    "workbench.action.files.saveAll",
    "workbench.action.files.revert",
    "workbench.action.toggleAutoSave",
    "workbench.action.closeActiveEditor",
    "workbench.action.navigateBack",
    "workbench.action.navigateForward",
    "squiggle.nextChange",
    "squiggle.previousChange",
    "squiggle.toggleFollowChanges",
    "squiggle.clearChanges",
    "squiggle.clearRecent",
    "squiggle.openFile",
    "copyFilePath",
    "copyRelativeFilePath",
  ],
  WP5: [
    "squiggle.view.select",
    "squiggle.toggleCodePane",
    "squiggle.run",
    "squiggle.toggleAutorun",
    "squiggle.revealInOutput",
    "squiggle.showFirstProblem",
    "editor.action.formatDocument",
    "squiggle.output.setLayout",
    "workbench.action.focusFirstEditorGroup",
    "workbench.action.focusSecondEditorGroup",
    "undo",
    "redo",
    "editor.action.clipboardCutAction",
    "editor.action.clipboardCopyAction",
    "editor.action.clipboardPasteAction",
    "editor.action.selectAll",
    "actions.find",
    "editor.action.startFindReplaceAction",
    "editor.action.commentLine",
  ],
  WP6: ["squiggle.rv.setTab", "squiggle.rv.copyCsv"],
  WP8: [
    "squiggle.agent.copyContext",
    "squiggle.copyViewLink",
    "squiggle.agent.copyRunCommand",
    "squiggle.agent.copyRenderCommand",
    "squiggle.agent.copyProblems",
    "squiggle.output.copyJson",
  ],
};

// Commands that ask for input (a dialog, a picker or an inline name) before
// acting: exactly these titles end with "…".
const ASKS_FOR_INPUT = new Set([
  "workbench.action.showCommands",
  "workbench.action.quickOpen",
  "workbench.action.quickOpenPreviousRecentlyUsedEditor",
  "workbench.action.openRecent",
  "workbench.action.files.openFolder",
  "workbench.action.files.openFile",
  "explorer.newFile",
  "explorer.newFolder",
  "renameFile",
  "squiggle.hub.import",
]);

// The two CodeMirror-owned commands whose global ⌥⇧ letter keys are allowed
// on macOS (their bindings carry `!textInputFocus`, so the character is still
// typed in inputs).
const MAC_ALT_LETTER_EXCEPTIONS = new Set([
  "editor.action.formatDocument",
  "squiggle.revealInOutput",
]);

// ── CodeMirror's keymaps, as Studio loads them ─────────────────────────────

type CmBinding = { key?: string; mac?: string; win?: string; linux?: string };

const CM_KEY_NAMES: Record<string, string> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  Space: "space",
  " ": "space",
  Enter: "enter",
  Escape: "escape",
  Backspace: "backspace",
  Delete: "delete",
  Home: "home",
  End: "end",
  PageUp: "pageup",
  PageDown: "pagedown",
  Tab: "tab",
};

function cmStroke(name: string, platform: Platform): string {
  const parts = name.split(/-(?!$)/);
  const key = parts.pop()!;
  const stroke: Stroke = {
    key: "",
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
  };
  for (const mod of parts) {
    if (mod === "Mod") {
      if (platform === "mac") stroke.meta = true;
      else stroke.ctrl = true;
    } else if (mod === "Cmd" || mod === "Meta" || mod === "M")
      stroke.meta = true;
    else if (mod === "Ctrl" || mod === "Control" || mod === "c")
      stroke.ctrl = true;
    else if (mod === "Alt" || mod === "a") stroke.alt = true;
    else if (mod === "Shift" || mod === "s") stroke.shift = true;
    else throw new Error(`Unknown CodeMirror modifier ${mod} in ${name}`);
  }
  stroke.key =
    CM_KEY_NAMES[key] ??
    (/^F\d+$/.test(key)
      ? key.toLowerCase()
      : key.length === 1
        ? key.toLowerCase()
        : key.toLowerCase());
  return strokeToString(stroke);
}

const CM_KEYMAPS: readonly CmBinding[] = [
  ...closeBracketsKeymap,
  ...defaultKeymap,
  ...searchKeymap,
  ...historyKeymap,
  ...foldKeymap,
  ...completionKeymap,
  indentWithTab,
  // Squiggle's own CodeMirror keys (components/CodeEditor).
  { key: "Mod-Enter" },
  { key: "Alt-Shift-f" },
  { key: "Alt-Shift-v" },
];

function codeMirrorKeys(platform: Platform): Set<string> {
  const keys = new Set<string>();
  for (const b of CM_KEYMAPS) {
    const name = b[platform] ?? b.key;
    if (!name) continue;
    // Only the first stroke matters: it's what Studio's dispatcher sees.
    keys.add(cmStroke(name.split(" ")[0], platform));
  }
  return keys;
}

// A context with the focus in the code editor.
const FOCUS_KEYS = new Set([
  "editorTextFocus",
  "textInputFocus",
  "filesExplorerFocus",
  "focusRegion",
  "overlayOpen",
  "menuOpen",
]);
function editorContext(platform: Platform, host: Host) {
  return {
    editorTextFocus: true,
    textInputFocus: false,
    filesExplorerFocus: false,
    focusRegion: "editor",
    overlayOpen: false,
    menuOpen: false,
    isMac: platform === "mac",
    isWindows: platform === "win",
    isLinux: platform === "linux",
    isElectron: host === "electron",
    isWeb: host === "web",
    host,
  };
}

// Would the dispatcher run this binding while CodeMirror has focus?
function dispatchedInEditor(e: Entry, platform: Platform, host: Host): boolean {
  const { spec, binding } = e;
  if (
    binding.display ||
    spec.owner === "region" ||
    spec.owner === "codemirror"
  ) {
    return false;
  }
  if (
    host === "electron" &&
    (spec.owner === "main" ||
      spec.owner === "role" ||
      spec.electronOwner === "main")
  ) {
    return false;
  }
  const first = e.strokes[0];
  if (!isModified(first) && !isFunctionKeyStroke(first) && first.key !== "?") {
    return false;
  }
  if (!binding.when) return true;
  if (
    !whenKeys(binding.when).some((k) => FOCUS_KEYS.has(k) || k.startsWith("is"))
  ) {
    return true;
  }
  return evaluateWhen(binding.when, editorContext(platform, host));
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("command ids and titles", () => {
  test("ids are unique", () => {
    const ids = STUDIO_COMMANDS.map((c) => c.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  test("every command has a title and a category", () => {
    for (const c of STUDIO_COMMANDS) {
      expect(c.title.trim(), c.id).not.toBe("");
      expect(c.category, c.id).toBeTruthy();
    }
  });

  test("titles end with … exactly when the command asks for input first", () => {
    for (const c of STUDIO_COMMANDS) {
      for (const title of [c.title, c.menuTitle].filter(
        (t): t is string => t !== undefined
      )) {
        expect(title.includes("..."), `${c.id}: use "…"`).toBe(false);
        expect(title.endsWith("…"), `${c.id}: "${title}"`).toBe(
          ASKS_FOR_INPUT.has(c.id)
        );
      }
    }
  });

  test("every id in a package's Registers list exists, and every command is in one", () => {
    const listed = new Set(Object.values(REGISTERS).flat());
    for (const [wp, ids] of Object.entries(REGISTERS)) {
      for (const id of ids)
        expect(getCommand(id), `${wp}: ${id}`).toBeDefined();
    }
    for (const c of STUDIO_COMMANDS) {
      expect(listed.has(c.id), `${c.id} is in no Registers list`).toBe(true);
    }
  });

  test("role commands name their Electron role", () => {
    for (const c of STUDIO_COMMANDS) {
      expect(c.owner === "role", c.id).toBe(c.electronRole !== undefined);
    }
  });
});

describe("when-clauses and context keys", () => {
  const clauses = STUDIO_COMMANDS.flatMap((c) => [
    ...(c.precondition ? [{ id: c.id, clause: c.precondition }] : []),
    ...(c.toggled ? [{ id: c.id, clause: c.toggled }] : []),
    ...(c.keys ?? []).flatMap((b) =>
      b.when ? [{ id: c.id, clause: b.when }] : []
    ),
  ]);

  test("every clause parses", () => {
    for (const { id, clause } of clauses) {
      expect(() => parseWhen(clause), `${id}: ${clause}`).not.toThrow();
    }
  });

  test("every key a clause reads is published by some owner", () => {
    for (const { id, clause } of clauses) {
      for (const key of whenKeys(clause)) {
        expect(
          PUBLISHED_KEYS.has(key),
          `${id}: unknown context key "${key}"`
        ).toBe(true);
      }
    }
  });

  test("every toggled or radio command has a published context key", () => {
    for (const c of STUDIO_COMMANDS) {
      if (c.radio) {
        expect(
          PUBLISHED_KEYS.has(c.radio.group),
          `${c.id}: ${c.radio.group}`
        ).toBe(true);
      }
      if (c.toggled)
        expect(whenKeys(c.toggled).length, c.id).toBeGreaterThan(0);
    }
  });
});

describe("menus", () => {
  test("the six menus, in order", () => {
    expect(STUDIO_MENUS.map((m) => m.id)).toEqual([
      "file",
      "edit",
      "view",
      "go",
      "run",
      "help",
    ]);
    for (const m of STUDIO_MENUS) {
      expect(m.title.startsWith(m.mnemonic), m.id).toBe(true);
    }
  });

  test("every menu node resolves", () => {
    for (const menu of STUDIO_MENUS) {
      for (const id of menuCommandIds(menu.items)) {
        expect(getCommand(id), `${menu.id}: ${id}`).toBeDefined();
      }
    }
  });

  test("parameterized items carry args, and only radio commands have several items", () => {
    const visit = (nodes: readonly MenuNode[]) => {
      for (const node of nodes) {
        if ("submenu" in node) visit(node.items);
        if (!("command" in node)) continue;
        const spec = getCommand(node.command)!;
        if (spec.radio && "arg" in spec.radio) {
          expect(node.args, node.command).toBeDefined();
          expect(node.title, node.command).toBeDefined();
        }
      }
    };
    for (const menu of STUDIO_MENUS) visit(menu.items);
  });

  test("dynamic nodes", () => {
    const dynamics: string[] = [];
    const visit = (nodes: readonly MenuNode[]) => {
      for (const node of nodes) {
        if ("submenu" in node) visit(node.items);
        if ("dynamic" in node) dynamics.push(node.dynamic);
      }
    };
    for (const menu of STUDIO_MENUS) visit(menu.items);
    expect(dynamics.sort()).toEqual(["changedFiles", "recent", "views"]);
  });
});

describe("keys", () => {
  test("every key string parses", () => {
    for (const c of STUDIO_COMMANDS) {
      for (const b of c.keys ?? []) {
        for (const p of PLATFORMS) {
          const key = keyForPlatform(b, p);
          if (key) expect(() => parseKey(key), `${c.id}: ${key}`).not.toThrow();
        }
      }
    }
    for (const builtin of EDITOR_BUILTINS) {
      for (const b of builtin.keys) {
        expect(b.display, builtin.title).toBe(true);
        for (const p of PLATFORMS) {
          const key = keyForPlatform(b, p);
          if (key) expect(() => parseKey(key)).not.toThrow();
        }
      }
    }
  });

  test("the only chord prefix is ⌘K / Ctrl+K", () => {
    for (const p of PLATFORMS) {
      const prefixes = new Set(
        entries(p)
          .filter((e) => e.strokes.length > 1)
          .map((e) => strokeToString(e.strokes[0]))
      );
      expect([...prefixes]).toEqual([p === "mac" ? "cmd+k" : "ctrl+k"]);
    }
  });

  test("bare keys are never global, except ?", () => {
    for (const p of PLATFORMS) {
      for (const e of entries(p)) {
        if (e.binding.display) continue;
        const first = e.strokes[0];
        if (isModified(first) || isFunctionKeyStroke(first)) continue;
        if (first.key === "?") {
          expect(e.binding.when, e.spec.id).toBe(
            "!editorTextFocus && !textInputFocus"
          );
          continue;
        }
        // Region keys: the Explorer's onKeyDown handles them.
        const regionScoped =
          e.spec.owner === "region" ||
          (e.binding.when !== undefined &&
            whenKeys(e.binding.when).includes("filesExplorerFocus"));
        expect(regionScoped, `${e.spec.id}: bare "${e.key}" on ${p}`).toBe(
          true
        );
      }
    }
  });

  test("the CodeMirror key list is read correctly", () => {
    const mac = codeMirrorKeys("mac");
    const win = codeMirrorKeys("win");
    // Spot checks from §4.6's list, so the collision test can't pass vacuously.
    for (const key of [
      "cmd+d",
      "cmd+f",
      "cmd+i",
      "cmd+/",
      "shift+cmd+k",
      "ctrl+b",
      "ctrl+e",
      "cmd+[",
      "alt+cmd+[",
      "cmd+enter",
      "alt+shift+f",
      "ctrl+space",
      "f3",
    ]) {
      expect(mac.has(key), key).toBe(true);
    }
    for (const key of [
      "ctrl+d",
      "alt+left",
      "alt+right",
      "ctrl+shift+[",
      "ctrl+alt+[",
      "alt+l",
      "ctrl+m",
      "ctrl+enter",
      "ctrl+shift+k",
    ]) {
      expect(win.has(key), key).toBe(true);
    }
  });

  test("no global binding collides with CodeMirror's keymaps", () => {
    for (const p of PLATFORMS) {
      const cm = codeMirrorKeys(p);
      for (const host of HOSTS) {
        for (const e of entries(p, host)) {
          if (!dispatchedInEditor(e, p, host)) continue;
          const first = strokeToString(e.strokes[0]);
          expect(
            cm.has(first),
            `${e.spec.id}: ${e.key} on ${p}/${host} is CodeMirror's`
          ).toBe(false);
        }
      }
    }
  });

  test("Squiggle's CodeMirror keys belong to the CodeMirror-owned commands only", () => {
    for (const p of PLATFORMS) {
      const squiggleKeys = new Map([
        [cmStroke("Mod-Enter", p), "squiggle.run"],
        [cmStroke("Alt-Shift-f", p), "editor.action.formatDocument"],
        [cmStroke("Alt-Shift-v", p), "squiggle.revealInOutput"],
      ]);
      for (const e of entries(p)) {
        const owner = squiggleKeys.get(e.key);
        if (owner) expect(e.spec.id).toBe(owner);
      }
    }
  });

  test("no browser-host binding uses a reserved key", () => {
    for (const p of PLATFORMS) {
      const all = new Set(BROWSER_RESERVED[p].all.map(canonicalKey));
      const firefox = new Set(BROWSER_RESERVED[p].firefox.map(canonicalKey));
      for (const e of entries(p, "web")) {
        expect(
          all.has(e.key),
          `${e.spec.id}: ${e.key} is reserved on ${p}`
        ).toBe(false);
        if (firefox.has(e.key)) {
          const alternates = entries(p, "web").filter(
            (o) =>
              o.spec.id === e.spec.id && !all.has(o.key) && !firefox.has(o.key)
          );
          expect(
            alternates.length,
            `${e.spec.id}: ${e.key} needs an alternate`
          ).toBeGreaterThan(0);
        }
      }
    }
  });

  test("no Ctrl+Alt+letter or digit on Windows/Linux (AltGr)", () => {
    for (const p of ["win", "linux"] as const) {
      for (const e of entries(p)) {
        for (const s of e.strokes) {
          expect(
            s.ctrl && s.alt && /^[a-z0-9]$/.test(s.key),
            `${e.spec.id}: ${e.key}`
          ).toBe(false);
        }
      }
    }
  });

  test("no global ⌥-letter keys on macOS (they type characters)", () => {
    for (const e of entries("mac")) {
      if (e.binding.display) continue;
      const s = e.strokes[0];
      const altLetter = s.alt && !s.ctrl && !s.meta && /^[a-z]$/.test(s.key);
      if (!altLetter) continue;
      expect(
        MAC_ALT_LETTER_EXCEPTIONS.has(e.spec.id),
        `${e.spec.id}: ${e.key}`
      ).toBe(true);
      expect(e.spec.owner).toBe("codemirror");
      expect(e.binding.when).toBe("!textInputFocus");
    }
  });

  test("no two commands share a key in the same context", () => {
    for (const p of PLATFORMS) {
      for (const host of HOSTS) {
        const seen = new Map<string, string>();
        for (const e of entries(p, host)) {
          if (e.binding.display) continue;
          const slot = `${e.key}|${e.binding.when ?? ""}`;
          const other = seen.get(slot);
          if (other && other !== e.spec.id) {
            throw new Error(
              `${e.key} (${p}/${host}) is bound to ${other} and ${e.spec.id}`
            );
          }
          seen.set(slot, e.spec.id);
        }
      }
    }
  });

  test("⌘K N and ⌘K ⌘N select the Nth view", () => {
    const view = getCommand("squiggle.view.select")!;
    const keys = (view.keys ?? []).map((b) => [b.mac, b.args]);
    expect(keys).toContainEqual(["cmd+k 3", { index: 3 }]);
    expect(keys).toContainEqual(["cmd+k cmd+3", { index: 3 }]);
    expect(view.keys).toHaveLength(18);
  });
});
