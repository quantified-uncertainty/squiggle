// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  createContextPublisher,
  getContext,
  patchContextKeys,
  resetContextForTests,
} from "../src/client/commands/context.js";
import {
  getPendingChord,
  installDispatcher,
} from "../src/client/commands/dispatcher.js";
import {
  installFocusTracking,
  resetFocusForTests,
  useOverlay,
} from "../src/client/commands/focus.js";
import {
  isCommandEnabled,
  registerCommand,
  resetRegistryForTests,
  runCommand,
} from "../src/client/commands/registry.js";
import { overrideHost } from "../src/client/lib/host.js";
import { STUDIO_COMMANDS } from "../src/shared/commands/index.js";

let cleanup: Array<() => void> = [];
let ctx: number;
const setContext = (keys: Record<string, unknown>) =>
  patchContextKeys(ctx, keys);

type KeyInit = KeyboardEventInit & { key: string };

function press(
  init: KeyInit,
  target: EventTarget = document.activeElement ?? document.body
) {
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
}

function release(
  init: KeyInit,
  target: EventTarget = document.activeElement ?? document.body
) {
  const event = new KeyboardEvent("keyup", {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
}

const handlers = new Map<string, ReturnType<typeof vi.fn>>();
function handle(id: string) {
  const fn = vi.fn();
  handlers.set(id, fn);
  cleanup.push(registerCommand(id, fn));
  return fn;
}

function setup(
  platform: "mac" | "win" | "linux",
  kind: "web" | "electron" = "web"
) {
  overrideHost({ platform, kind });
  cleanup.push(installFocusTracking());
  cleanup.push(
    installDispatcher({
      commands: STUDIO_COMMANDS,
      isEnabled: isCommandEnabled,
      run: (id, args) => runCommand(id, args, "key"),
      getContext,
    })
  );
}

beforeEach(() => {
  document.body.innerHTML = "";
  resetRegistryForTests();
  resetContextForTests();
  resetFocusForTests();
  ctx = createContextPublisher();
  handlers.clear();
});

afterEach(() => {
  for (const fn of cleanup.reverse()) fn();
  cleanup = [];
});

const focusable = (html: string): HTMLElement => {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);
  const el = wrapper.firstElementChild as HTMLElement;
  el.focus();
  return el;
};

describe("dispatcher (macOS, browser)", () => {
  beforeEach(() => setup("mac"));

  test("⇧⌥F in an <input> runs nothing and isn't prevented, so the character is typed", () => {
    const format = handle("editor.action.formatDocument");
    setContext({ hasCodeEditor: true });
    const input = focusable(`<input type="text" />`);
    const e = press(
      { key: "Ï", code: "KeyF", altKey: true, shiftKey: true },
      input
    );
    expect(format).not.toHaveBeenCalled();
    expect(e.defaultPrevented).toBe(false);

    // Outside text inputs the same key formats.
    const div = focusable(`<div tabindex="0"></div>`);
    const e2 = press(
      { key: "Ï", code: "KeyF", altKey: true, shiftKey: true },
      div
    );
    expect(format).toHaveBeenCalledTimes(1);
    expect(e2.defaultPrevented).toBe(true);
  });

  test("⌘S is prevented even with no file to save", () => {
    const e = press({ key: "s", code: "KeyS", metaKey: true });
    expect(e.defaultPrevented).toBe(true);
    expect(window.__studioCommandLog ?? []).toEqual([]);
  });

  test("an auto-repeated non-repeatable key runs once", () => {
    const toggle = handle("workbench.action.toggleSidebarVisibility");
    press({ key: "b", code: "KeyB", metaKey: true });
    const repeat = press({
      key: "b",
      code: "KeyB",
      metaKey: true,
      repeat: true,
    });
    press({ key: "b", code: "KeyB", metaKey: true, repeat: true });
    expect(toggle).toHaveBeenCalledTimes(1);
    expect(repeat.defaultPrevented).toBe(true);
  });

  test("a ⌘K chord resolves on the next key", () => {
    const follow = handle("squiggle.toggleFollowChanges");
    const first = press({ key: "k", code: "KeyK", metaKey: true });
    expect(first.defaultPrevented).toBe(true);
    expect(getPendingChord()).toBe("cmd+k");
    const second = press({ key: "f", code: "KeyF" });
    expect(second.defaultPrevented).toBe(true);
    expect(follow).toHaveBeenCalledTimes(1);
    expect(getPendingChord()).toBeNull();
  });

  test("⌘K ⌘1 and ⌘K 1 pass the view index", () => {
    setContext({ activeFileIsSquiggle: true });
    const select = handle("squiggle.view.select");
    press({ key: "k", code: "KeyK", metaKey: true });
    press({ key: "2", code: "Digit2", metaKey: true });
    press({ key: "k", code: "KeyK", metaKey: true });
    press({ key: "3", code: "Digit3" });
    expect(select.mock.calls).toEqual([[{ index: 2 }], [{ index: 3 }]]);
  });

  test("Esc cancels a chord and is swallowed", () => {
    const follow = handle("squiggle.toggleFollowChanges");
    press({ key: "k", code: "KeyK", metaKey: true });
    const esc = press({ key: "Escape", code: "Escape" });
    expect(esc.defaultPrevented).toBe(true);
    expect(getPendingChord()).toBeNull();
    // A plain "f" afterwards is just typing.
    const f = press({ key: "f", code: "KeyF" });
    expect(f.defaultPrevented).toBe(false);
    expect(follow).not.toHaveBeenCalled();
  });

  test("an unbound second key cancels the chord (swallowed); a pointerdown cancels too", () => {
    const follow = handle("squiggle.toggleFollowChanges");
    press({ key: "k", code: "KeyK", metaKey: true });
    const z = press({ key: "z", code: "KeyZ" });
    expect(z.defaultPrevented).toBe(true);
    expect(getPendingChord()).toBeNull();
    press({ key: "k", code: "KeyK", metaKey: true });
    window.dispatchEvent(new Event("pointerdown"));
    expect(getPendingChord()).toBeNull();
    press({ key: "f", code: "KeyF" });
    expect(follow).not.toHaveBeenCalled();
  });

  test("while a menu is open, Studio keys are only prevented", () => {
    const toggle = handle("workbench.action.toggleSidebarVisibility");
    setContext({ menuOpen: true }); // published by the menubar (WP1)
    const studioKey = press({ key: "b", code: "KeyB", metaKey: true });
    expect(studioKey.defaultPrevented).toBe(true);
    expect(toggle).not.toHaveBeenCalled();
    const print = press({ key: "p", code: "KeyP", metaKey: true });
    expect(print.defaultPrevented).toBe(true);
    const typing = press({ key: "a", code: "KeyA" });
    expect(typing.defaultPrevented).toBe(false);
  });

  test("while an overlay is open (useOverlay), Studio keys are only prevented", async () => {
    const { act, createElement } = await import("react");
    const { createRoot } = await import("react-dom/client");
    (
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    const Overlay = () => {
      useOverlay(true);
      return null;
    };
    const toggle = handle("workbench.action.toggleSidebarVisibility");
    const root = createRoot(document.createElement("div"));
    act(() => root.render(createElement(Overlay)));
    const e = press({ key: "b", code: "KeyB", metaKey: true });
    expect(e.defaultPrevented).toBe(true);
    expect(toggle).not.toHaveBeenCalled();
    act(() => root.unmount());
    press({ key: "b", code: "KeyB", metaKey: true });
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  test("? opens the sheet outside editors and inputs only", () => {
    const sheet = handle("workbench.action.openGlobalKeybindings");
    focusable(`<div tabindex="0"></div>`);
    press({ key: "?", code: "Slash", shiftKey: true });
    expect(sheet).toHaveBeenCalledTimes(1);
    const input = focusable(`<input type="text" />`);
    const e = press({ key: "?", code: "Slash", shiftKey: true }, input);
    expect(e.defaultPrevented).toBe(false);
    expect(sheet).toHaveBeenCalledTimes(1);
  });

  test("bare letters and Shift+letter are never global", () => {
    for (const command of STUDIO_COMMANDS) {
      if (command.owner === "renderer") handle(command.id);
    }
    setContext({ activeFile: "a.squiggle", activeFileIsSquiggle: true });
    focusable(`<div tabindex="0"></div>`);
    for (const key of "abcdefghijklmnopqrstuvwxyz[]-=/\\`") {
      expect(press({ key }).defaultPrevented, key).toBe(false);
      expect(
        press({ key: key.toUpperCase(), shiftKey: true }).defaultPrevented,
        key
      ).toBe(false);
    }
    expect([...handlers.values()].every((h) => h.mock.calls.length === 0)).toBe(
      true
    );
  });

  test("CodeMirror-owned commands are left to CodeMirror while the editor has focus", () => {
    const run = handle("squiggle.run");
    setContext({ activeFileIsSquiggle: true });
    const cm = focusable(
      `<div class="cm-editor"><div class="cm-content" contenteditable="true" tabindex="0"></div></div>`
    );
    const content = cm.querySelector(".cm-content") as HTMLElement;
    content.focus();
    const inEditor = press(
      { key: "Enter", code: "Enter", metaKey: true },
      content
    );
    expect(inEditor.defaultPrevented).toBe(false);
    expect(run).not.toHaveBeenCalled();
    focusable(`<div tabindex="0"></div>`);
    press({ key: "Enter", code: "Enter", metaKey: true });
    expect(run).toHaveBeenCalledTimes(1);
  });

  test("disabled commands let their keys pass through", () => {
    handle("workbench.action.navigateBack"); // precondition canGoBack
    setContext({ canGoBack: false });
    const e = press({ key: "-", code: "Minus", ctrlKey: true });
    expect(e.defaultPrevented).toBe(false);
    setContext({ canGoBack: true });
    expect(
      press({ key: "-", code: "Minus", ctrlKey: true }).defaultPrevented
    ).toBe(true);
  });

  test("Option rewriting: ⌥⌘N (a dead key) still opens New File", () => {
    const newFile = handle("explorer.newFile");
    press({ key: "Dead", code: "KeyN", altKey: true, metaKey: true });
    expect(newFile).toHaveBeenCalledTimes(1);
  });

  test("IME composition is ignored", () => {
    const toggle = handle("workbench.action.toggleSidebarVisibility");
    const e = press({
      key: "b",
      code: "KeyB",
      metaKey: true,
      isComposing: true,
    });
    expect(e.defaultPrevented).toBe(false);
    expect(toggle).not.toHaveBeenCalled();
  });

  test("F10 focuses the menubar in a browser", () => {
    const menubar = handle("squiggle.focusMenuBar");
    const e = press({ key: "F10", code: "F10" });
    expect(menubar).toHaveBeenCalledTimes(1);
    expect(e.defaultPrevented).toBe(true);
  });

  test("one keypress runs one command (the log)", () => {
    handle("workbench.action.toggleSidebarVisibility");
    press({ key: "b", code: "KeyB", metaKey: true });
    expect(
      window.__studioCommandLog?.map((x) => `${x.source}:${x.id}`)
    ).toEqual(["key:workbench.action.toggleSidebarVisibility"]);
  });
});

describe("dispatcher (Windows, browser)", () => {
  beforeEach(() => setup("win"));

  test("an Alt tap focuses the menubar; Alt+N doesn't", () => {
    const menubar = handle("squiggle.focusMenuBar");
    const newFile = handle("explorer.newFile");
    press({ key: "Alt", code: "AltLeft", altKey: true });
    const up = release({ key: "Alt", code: "AltLeft" });
    expect(menubar).toHaveBeenCalledTimes(1);
    expect(up.defaultPrevented).toBe(true);

    press({ key: "Alt", code: "AltLeft", altKey: true });
    press({ key: "n", code: "KeyN", altKey: true });
    release({ key: "Alt", code: "AltLeft" });
    expect(newFile).toHaveBeenCalledTimes(1);
    expect(menubar).toHaveBeenCalledTimes(1);
  });

  test("a pointerdown disarms the Alt tap", () => {
    const menubar = handle("squiggle.focusMenuBar");
    press({ key: "Alt", code: "AltLeft", altKey: true });
    window.dispatchEvent(new Event("pointerdown"));
    release({ key: "Alt", code: "AltLeft" });
    expect(menubar).not.toHaveBeenCalled();
  });

  test("AltGr characters never trigger commands", () => {
    handle("explorer.newFile");
    const e = press({
      key: "@",
      code: "KeyQ",
      ctrlKey: true,
      altKey: true,
      modifierAltGraph: true,
    } as KeyInit);
    expect(e.defaultPrevented).toBe(false);
  });

  test("Alt+← is Back outside editors and inputs only", () => {
    const back = handle("workbench.action.navigateBack");
    setContext({ canGoBack: true });
    const input = focusable(`<input type="text" />`);
    expect(
      press({ key: "ArrowLeft", code: "ArrowLeft", altKey: true }, input)
        .defaultPrevented
    ).toBe(false);
    focusable(`<div tabindex="0"></div>`);
    press({ key: "ArrowLeft", code: "ArrowLeft", altKey: true });
    expect(back).toHaveBeenCalledTimes(1);
  });

  test("Ctrl+K S saves all (a chord, since Ctrl+Alt+S is AltGr)", () => {
    const saveAll = handle("workbench.action.files.saveAll");
    setContext({ dirtyCount: 2 });
    press({ key: "k", code: "KeyK", ctrlKey: true });
    press({ key: "s", code: "KeyS" });
    expect(saveAll).toHaveBeenCalledTimes(1);
  });
});

describe("dispatcher (Electron)", () => {
  beforeEach(() => setup("mac", "electron"));

  test("Electron-only bindings work, and main-process commands are left to the native menu", () => {
    const close = handle("workbench.action.closeActiveEditor");
    setContext({ activeFile: "a.squiggle" });
    expect(
      press({ key: "w", code: "KeyW", metaKey: true }).defaultPrevented
    ).toBe(true);
    expect(close).toHaveBeenCalledTimes(1);

    // Full Screen is the main process's in Electron.
    const fullScreen = handle("workbench.action.toggleFullScreen");
    const e = press({ key: "f", code: "KeyF", ctrlKey: true, metaKey: true });
    expect(e.defaultPrevented).toBe(false);
    expect(fullScreen).not.toHaveBeenCalled();
  });

  test("F10 doesn't focus an in-app menubar", () => {
    const menubar = handle("squiggle.focusMenuBar");
    press({ key: "F10", code: "F10" });
    expect(menubar).not.toHaveBeenCalled();
  });
});
