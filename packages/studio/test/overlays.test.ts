// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  createContextPublisher,
  getContext,
  patchContextKeys,
  resetContextForTests,
} from "../src/client/commands/context.js";
import { OverlayHost } from "../src/client/commands/OverlayHost.js";
import {
  registerCommand,
  resetRegistryForTests,
  runCommand,
} from "../src/client/commands/registry.js";
import { overrideHost } from "../src/client/lib/host.js";
import {
  type QuickPickItem,
  showQuickPick,
} from "../src/client/lib/quickPick.js";
import { getGlobalState } from "../src/client/lib/studioState.js";
import {
  type Workspace,
  WorkspaceContext,
} from "../src/client/lib/workspaceTypes.js";
import type { TreeNode } from "../src/shared/api.js";
import { z } from "zod";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

// jsdom doesn't implement it.
Element.prototype.scrollIntoView = () => undefined;

const file = (path: string): TreeNode => ({
  type: "file",
  name: path.slice(path.lastIndexOf("/") + 1),
  path,
});

function fakeWorkspace(overrides: Partial<Workspace> = {}): Workspace {
  const noop = () => undefined;
  const done = async () => undefined;
  return {
    rootInfo: { root: "/models", name: "models", allowOpenFolder: true },
    tree: [file("a.squiggle"), file("b.squiggle"), file("lib/c.squiggle")],
    treeLoaded: true,
    treeSkipped: [],
    treeTruncated: false,
    recentFolders: [],
    files: {},
    activePath: "a.squiggle",
    mru: ["a.squiggle", "b.squiggle", "lib/c.squiggle"],
    externalChanges: {},
    connection: "live",
    rootMissing: false,
    viewIds: {},
    selectView: noop,
    history: {
      canGoBack: false,
      canGoForward: false,
      back: noop,
      forward: noop,
    },
    openFile: vi.fn(),
    closeFile: done,
    setBuffer: noop,
    saveFile: done,
    saveAll: done,
    flushAll: done,
    saveState: () => "saved",
    reloadFromDisk: done,
    overwriteWithMine: done,
    createFile: async (path) => path,
    renameFile: async (_from, to) => to,
    importFromHub: async (id) => id,
    openFolder: done,
    followRootChange: done,
    refreshTree: done,
    resync: done,
    recordDependency: noop,
    markSeen: noop,
    clearChanges: noop,
    clearRecent: noop,
    nextChange: noop,
    setFollowChanges: noop,
    ...overrides,
  };
}

let root: Root;
let container: HTMLElement;
let workspace: Workspace;
let before: HTMLButtonElement;

function mount(ws: Workspace) {
  workspace = ws;
  act(() => {
    root.render(
      createElement(
        WorkspaceContext.Provider,
        { value: ws },
        createElement(OverlayHost)
      )
    );
  });
}

const frame = () => new Promise((resolve) => setTimeout(resolve, 30));
const $ = (selector: string) => document.querySelector(selector);
const $$ = (selector: string) => [...document.querySelectorAll(selector)];
const input = () =>
  $("[data-testid='quick-pick'] input") as HTMLInputElement | null;

function key(target: EventTarget, init: KeyboardEventInit, type = "keydown") {
  act(() => {
    target.dispatchEvent(
      new KeyboardEvent(type, { bubbles: true, cancelable: true, ...init })
    );
  });
}

// Types into a React-controlled input.
function type(el: HTMLInputElement, value: string) {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    )?.set;
    setter?.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

const selectedRow = () =>
  $("[data-testid='quick-pick-item'][aria-selected='true']");

beforeEach(() => {
  document.body.innerHTML = "";
  resetRegistryForTests();
  resetContextForTests();
  overrideHost({ kind: "web", platform: "mac" });
  patchContextKeys(createContextPublisher(), { recentFileCount: 2 });
  container = document.createElement("div");
  document.body.appendChild(container);
  // Focus that the overlays must give back.
  before = document.createElement("button");
  before.textContent = "before";
  document.body.appendChild(before);
  before.focus();
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
});

describe("showQuickPick", () => {
  const items: QuickPickItem[] = [
    { id: "f1", label: "models", description: "~/models", group: "Folders" },
    { id: "f2", label: "other", description: "~/other", group: "Folders" },
    { id: "x", label: "cost model", group: "Files", disabled: true },
    { id: "c", label: "costs.squiggle", group: "Files" },
  ];

  test("filters, accepts with Enter and gives focus back", async () => {
    mount(fakeWorkspace());
    let picked: Promise<QuickPickItem | undefined> | undefined;
    act(() => {
      picked = showQuickPick(items, { title: "Open Recent" });
    });
    expect($("[data-testid='quick-pick']")?.getAttribute("data-mode")).toBe(
      "pick"
    );
    expect(document.activeElement).toBe(input());
    // Groups and disabled rows.
    const groups = $$("[role='group']").map((g) => g.textContent);
    expect(groups[0]).toContain("Folders");
    expect(
      $("[data-id='x']")?.getAttribute("aria-disabled"),
      "disabled rows are marked"
    ).toBe("true");
    type(input() as HTMLInputElement, "cost");
    // The disabled "cost model" is skipped; costs.squiggle is active.
    expect(selectedRow()?.getAttribute("data-id")).toBe("c");
    key(input() as HTMLInputElement, { key: "Enter" });
    expect(await picked).toEqual(items[3]);
    expect($("[data-testid='quick-pick']")).toBeNull();
    expect(document.activeElement).toBe(before);
  });

  test("Esc resolves with undefined; a newer request replaces an open one", async () => {
    mount(fakeWorkspace());
    let first: Promise<QuickPickItem | undefined> | undefined;
    let second: Promise<QuickPickItem | undefined> | undefined;
    act(() => {
      first = showQuickPick(items);
    });
    act(() => {
      second = showQuickPick(items.slice(0, 1));
    });
    expect(await first).toBeUndefined();
    expect($$("[data-testid='quick-pick-item']")).toHaveLength(1);
    key(input() as HTMLInputElement, { key: "Escape" });
    expect(await second).toBeUndefined();
    expect(document.activeElement).toBe(before);
    expect(getContext()["overlayOpen"]).toBe(false);
  });

  test("throws without a host", async () => {
    await expect(showQuickPick(items)).rejects.toThrow(
      "No quick pick host is mounted"
    );
  });
});

describe("Quick Open and the palette", () => {
  test("⌘P ↵ opens the previous file and moves focus to the main area", () => {
    mount(fakeWorkspace());
    act(() => {
      runCommand("workbench.action.quickOpen", undefined, "key");
    });
    expect(getContext()["overlayOpen"]).toBe(true);
    expect(selectedRow()?.getAttribute("data-path")).toBe("b.squiggle");
    key(input() as HTMLInputElement, { key: "Enter" });
    expect(workspace.openFile).toHaveBeenCalledWith("b.squiggle", {
      reason: "quick-open",
      focus: "main",
    });
    expect($("[data-testid='quick-pick']")).toBeNull();
  });

  test("↓ and ⌘P move the selection; Esc closes", () => {
    mount(fakeWorkspace());
    act(() => {
      runCommand("workbench.action.quickOpen", undefined, "key");
    });
    key(input() as HTMLInputElement, { key: "ArrowDown" });
    expect(selectedRow()?.getAttribute("data-path")).toBe("lib/c.squiggle");
    // Wraps around.
    key(input() as HTMLInputElement, { key: "p", code: "KeyP", metaKey: true });
    expect(selectedRow()?.getAttribute("data-path")).toBe("b.squiggle");
    key(input() as HTMLInputElement, { key: "Escape" });
    expect($("[data-testid='quick-pick']")).toBeNull();
    expect(workspace.openFile).not.toHaveBeenCalled();
  });

  test("the palette runs the command after closing and remembers it", async () => {
    const docs = vi.fn();
    registerCommand("squiggle.help.docs", docs);
    mount(fakeWorkspace());
    act(() => {
      runCommand("workbench.action.showCommands", undefined, "key");
    });
    expect($("[data-testid='quick-pick']")?.getAttribute("data-mode")).toBe(
      "commands"
    );
    type(input() as HTMLInputElement, ">documentation");
    expect(selectedRow()?.getAttribute("data-command")).toBe(
      "squiggle.help.docs"
    );
    key(input() as HTMLInputElement, { key: "Enter" });
    expect($("[data-testid='quick-pick']")).toBeNull();
    expect(document.activeElement).toBe(before);
    expect(docs).not.toHaveBeenCalled(); // runs on the next frame
    await act(frame);
    expect(docs).toHaveBeenCalledTimes(1);
    expect(
      getGlobalState("palette.recentCommands", z.array(z.string()), [])
    ).toEqual(["squiggle.help.docs"]);
    // Backspace on the bare `>` goes back to files.
    act(() => {
      runCommand("workbench.action.showCommands", undefined, "key");
    });
    type(input() as HTMLInputElement, "");
    expect($("[data-testid='quick-pick']")?.getAttribute("data-mode")).toBe(
      "files"
    );
  });
});

describe("recent-files switcher", () => {
  test("hold ⌃: ` moves down, ⇧` up, releasing opens the selection", () => {
    mount(fakeWorkspace());
    key(window, { key: "Control", ctrlKey: true });
    act(() => {
      runCommand(
        "workbench.action.quickOpenPreviousRecentlyUsedEditor",
        undefined,
        "key"
      );
    });
    const switcher = $("[data-testid='recent-files-switcher']");
    expect(switcher?.getAttribute("data-hold")).toBe("1");
    const selected = () =>
      $(
        "[data-testid='recent-files-switcher'] [aria-selected='true']"
      )?.getAttribute("data-path");
    expect(selected()).toBe("b.squiggle");
    key(window, { key: "`", code: "Backquote", ctrlKey: true });
    expect(selected()).toBe("lib/c.squiggle");
    key(window, { key: "~", code: "Backquote", ctrlKey: true, shiftKey: true });
    expect(selected()).toBe("b.squiggle");
    key(window, { key: "`", code: "Backquote", ctrlKey: true });
    key(window, { key: "Control" }, "keyup");
    expect(workspace.openFile).toHaveBeenCalledWith("lib/c.squiggle", {
      reason: "switcher",
    });
    expect($("[data-testid='recent-files-switcher']")).toBeNull();
  });

  test("opened without Control held it is a plain list (↓, Enter)", () => {
    mount(fakeWorkspace());
    key(window, { key: "Control", ctrlKey: true });
    key(window, { key: "Control" }, "keyup");
    act(() => {
      runCommand(
        "workbench.action.quickOpenPreviousRecentlyUsedEditor",
        undefined,
        "api"
      );
    });
    expect(
      $("[data-testid='recent-files-switcher']")?.getAttribute("data-hold")
    ).toBe("0");
    key(window, { key: "ArrowDown" });
    key(window, { key: "Enter" });
    expect(workspace.openFile).toHaveBeenCalledWith("lib/c.squiggle", {
      reason: "switcher",
    });
  });

  test("Esc cancels and gives focus back", () => {
    mount(fakeWorkspace());
    act(() => {
      runCommand(
        "workbench.action.quickOpenPreviousRecentlyUsedEditor",
        undefined,
        "api"
      );
    });
    expect(
      $("[data-testid='recent-files-switcher']")?.contains(
        document.activeElement
      )
    ).toBe(true);
    key(window, { key: "Escape" });
    expect($("[data-testid='recent-files-switcher']")).toBeNull();
    expect(workspace.openFile).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(before);
  });
});

describe("shortcut sheet and About", () => {
  test("the sheet filters rows and Esc restores focus", () => {
    mount(fakeWorkspace());
    act(() => {
      runCommand("workbench.action.openGlobalKeybindings", undefined, "key");
    });
    const filter = $(
      "[data-testid='shortcut-sheet'] input"
    ) as HTMLInputElement | null;
    expect(document.activeElement).toBe(filter);
    type(filter as HTMLInputElement, "save all");
    const rows = $$("[data-testid='shortcut-sheet'] li").map((li) =>
      li.getAttribute("data-command")
    );
    expect(rows).toEqual(["workbench.action.files.saveAll"]);
    key(filter as HTMLInputElement, { key: "Escape" });
    expect($("[data-testid='shortcut-sheet']")).toBeNull();
    expect(document.activeElement).toBe(before);
  });

  test("About lists the versions and the folder", () => {
    mount(fakeWorkspace());
    act(() => {
      runCommand("squiggle.help.about", undefined, "api");
    });
    const text = $("[data-testid='about-modal']")?.textContent ?? "";
    expect(text).toContain(__STUDIO_VERSION__);
    expect(text).toContain(__SQUIGGLE_LANG_VERSION__);
    expect(text).toContain("/models");
  });
});
