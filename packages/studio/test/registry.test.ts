// @vitest-environment jsdom
import { act, createElement, FC, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  createContextPublisher,
  patchContextKeys,
  resetContextForTests,
} from "../src/client/commands/context.js";
import {
  getCommandState,
  hasHandler,
  isCommandEnabled,
  listCommands,
  MENU_KEY_DEDUPE_MS,
  registerCommand,
  resetRegistryForTests,
  runCommand,
  runCommandAsync,
  startCommandLog,
  useCommand,
} from "../src/client/commands/registry.js";
import { overrideHost } from "../src/client/lib/host.js";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let ctx: number;
const setContext = (keys: Record<string, unknown>) =>
  patchContextKeys(ctx, keys);
const frame = () => new Promise((r) => setTimeout(r, 30));

beforeEach(() => {
  resetRegistryForTests();
  resetContextForTests();
  overrideHost({ kind: "web", platform: "mac" });
  ctx = createContextPublisher();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("enabled", () => {
  test("needs a handler, a true precondition and enabled !== false", () => {
    const id = "workbench.action.files.save"; // activeFile && !rootChanged && !rootMissing
    expect(isCommandEnabled(id)).toBe(false); // no handler
    const off = registerCommand(id, () => undefined);
    expect(isCommandEnabled(id)).toBe(false); // precondition: no activeFile
    setContext({ activeFile: "a.squiggle" });
    expect(isCommandEnabled(id)).toBe(true);
    setContext({ rootChanged: true });
    expect(isCommandEnabled(id)).toBe(false);
    setContext({ rootChanged: false });
    off();
    registerCommand(id, () => undefined, { enabled: false });
    expect(isCommandEnabled(id)).toBe(false);
  });

  test("host-only commands are disabled on the other host", () => {
    registerCommand("squiggle.help.about", () => undefined); // hosts: ["web"]
    expect(isCommandEnabled("squiggle.help.about")).toBe(true);
    overrideHost({ kind: "electron" });
    expect(isCommandEnabled("squiggle.help.about")).toBe(false);
    expect(
      listCommands().some((c) => c.spec.id === "squiggle.help.about")
    ).toBe(false);
  });

  test("a disabled command doesn't run, and runCommandAsync says why", async () => {
    const handler = vi.fn();
    registerCommand("workbench.action.files.save", handler);
    expect(runCommand("workbench.action.files.save")).toBe(false);
    expect(handler).not.toHaveBeenCalled();
    expect(await runCommandAsync("workbench.action.files.save")).toEqual({
      ok: false,
      error: "disabled: activeFile && !rootChanged && !rootMissing",
    });
    expect(await runCommandAsync("no.such.command")).toEqual({
      ok: false,
      error: "unknown command",
    });
    expect(await runCommandAsync("squiggle.help.docs")).toEqual({
      ok: false,
      error: "disabled: no handler is mounted",
    });
  });

  test("checked comes from the option, toggled or the radio group", () => {
    registerCommand(
      "workbench.action.toggleSidebarVisibility",
      () => undefined
    );
    setContext({ sidebarVisible: true });
    expect(
      getCommandState("workbench.action.toggleSidebarVisibility").checked
    ).toBe(true);
    setContext({ sidebarVisible: false });
    expect(
      getCommandState("workbench.action.toggleSidebarVisibility").checked
    ).toBe(false);

    setContext({ "squiggle.outputLayout": "list" });
    expect(
      getCommandState("squiggle.output.setLayout", { layout: "list" }).checked
    ).toBe(true);
    expect(
      getCommandState("squiggle.output.setLayout", { layout: "cards" }).checked
    ).toBe(false);

    registerCommand("squiggle.toggleFollowChanges", () => undefined, {
      checked: true,
    });
    expect(getCommandState("squiggle.toggleFollowChanges").checked).toBe(true);
  });

  test("keys are formatted for the current platform and host", () => {
    expect(getCommandState("workbench.action.closeActiveEditor").keys).toEqual([
      "⌃W",
    ]);
    overrideHost({ kind: "electron" });
    expect(getCommandState("workbench.action.closeActiveEditor").keys).toEqual([
      "⌘W",
      "⌃W",
    ]);
    overrideHost({ kind: "web", platform: "win" });
    expect(getCommandState("workbench.action.showCommands").keys).toEqual([
      "Ctrl+Shift+P",
      "F1",
    ]);
  });
});

describe("handlers", () => {
  test("the most recently registered handler wins; unregistering restores the previous", () => {
    const a = vi.fn();
    const b = vi.fn();
    const offA = registerCommand("squiggle.help.docs", a);
    const offB = registerCommand("squiggle.help.docs", b);
    runCommand("squiggle.help.docs", undefined, "button");
    expect(b).toHaveBeenCalledTimes(1);
    expect(a).not.toHaveBeenCalled();
    offB();
    runCommand("squiggle.help.docs", undefined, "button");
    expect(a).toHaveBeenCalledTimes(1);
    offA();
    expect(hasHandler("squiggle.help.docs")).toBe(false);
  });

  test("a handler returning false is 'not handled'", async () => {
    registerCommand("squiggle.help.docs", () => false);
    expect(runCommand("squiggle.help.docs", undefined, "button")).toBe(false);
    expect(await runCommandAsync("squiggle.help.docs")).toEqual({
      ok: false,
      error: "not handled",
    });
  });

  test("thrown errors are reported", async () => {
    registerCommand("squiggle.help.docs", async () => {
      throw new Error("boom");
    });
    expect(await runCommandAsync("squiggle.help.docs")).toEqual({
      ok: false,
      error: "boom",
    });
  });

  test("args come from the call, else the command's defaults", () => {
    const handler = vi.fn();
    registerCommand("squiggle.openFile", handler);
    runCommand("squiggle.openFile", { path: "a.squiggle" }, "button");
    expect(handler).toHaveBeenCalledWith({ path: "a.squiggle" });
  });

  test("useCommand under StrictMode registers exactly one handler and removes it on unmount", () => {
    const handler = vi.fn();
    const Comp: FC = () => {
      useCommand("squiggle.help.docs", handler);
      return null;
    };
    const container = document.createElement("div");
    const root = createRoot(container);
    act(() =>
      root.render(createElement(StrictMode, null, createElement(Comp)))
    );
    expect(hasHandler("squiggle.help.docs")).toBe(true);
    runCommand("squiggle.help.docs", undefined, "button");
    expect(handler).toHaveBeenCalledTimes(1);
    act(() => root.unmount());
    expect(hasHandler("squiggle.help.docs")).toBe(false);
  });

  test("useCommand's enabled option updates without re-registering", () => {
    const Comp: FC<{ enabled: boolean }> = ({ enabled }) => {
      useCommand("squiggle.help.docs", () => undefined, { enabled });
      return null;
    };
    const root = createRoot(document.createElement("div"));
    act(() => root.render(createElement(Comp, { enabled: false })));
    expect(isCommandEnabled("squiggle.help.docs")).toBe(false);
    act(() => root.render(createElement(Comp, { enabled: true })));
    expect(isCommandEnabled("squiggle.help.docs")).toBe(true);
    act(() => root.unmount());
  });
});

describe("Electron double-fire backstop", () => {
  test("a menu call within 100 ms of a key call for the same id is dropped", async () => {
    const handler = vi.fn();
    registerCommand("squiggle.help.docs", handler);
    let now = 1_000_000;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    expect(runCommand("squiggle.help.docs", undefined, "key")).toBe(true);
    now += MENU_KEY_DEDUPE_MS - 10;
    expect(runCommand("squiggle.help.docs", undefined, "menu")).toBe(true);
    await frame();
    expect(handler).toHaveBeenCalledTimes(1);
    now += 20;
    expect(runCommand("squiggle.help.docs", undefined, "menu")).toBe(true);
    await frame();
    expect(handler).toHaveBeenCalledTimes(2);
  });

  test("a menu-key call runs only when a binding's when holds", async () => {
    const handler = vi.fn();
    registerCommand("renameFile", handler); // F2, when filesExplorerFocus
    setContext({ filesExplorerFocus: false });
    expect(runCommand("renameFile", undefined, "menu-key")).toBe(false);
    // A click on the native menu item (no key) is fine.
    expect(runCommand("renameFile", undefined, "menu")).toBe(true);
    await frame();
    expect(handler).toHaveBeenCalledTimes(1);
    setContext({ filesExplorerFocus: true });
    expect(runCommand("renameFile", undefined, "menu-key")).toBe(true);
    await frame();
    expect(handler).toHaveBeenCalledTimes(2);
  });

  test("palette and menu runs are deferred to the next frame", async () => {
    const handler = vi.fn();
    registerCommand("squiggle.help.docs", handler);
    runCommand("squiggle.help.docs", undefined, "palette");
    expect(handler).not.toHaveBeenCalled();
    await frame();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test("the command log records runs", () => {
    registerCommand("squiggle.help.docs", () => undefined);
    runCommand("squiggle.help.docs", undefined, "button");
    expect(window.__studioCommandLog?.map((e) => [e.id, e.source])).toEqual([
      ["squiggle.help.docs", "button"],
    ]);
  });

  test("startCommandLog creates an empty log and keeps an existing one", () => {
    delete window.__studioCommandLog;
    startCommandLog();
    expect(window.__studioCommandLog).toEqual([]);
    registerCommand("squiggle.help.docs", () => undefined);
    runCommand("squiggle.help.docs", undefined, "button");
    startCommandLog();
    expect(window.__studioCommandLog).toHaveLength(1);
  });
});
