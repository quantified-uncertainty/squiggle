import { describe, expect, test, vi } from "vitest";

import { commandMessage, runInPage, validateMenuState } from "../src/bridge.js";
import { buildMenuTemplate } from "../src/menu.js";
import type { CommandMessage } from "../src/bridge.js";

vi.mock("electron", () => ({
  app: { isPackaged: false, name: "Squiggle Studio" },
  BrowserWindow: class BrowserWindow {},
  dialog: {},
  Menu: {},
  shell: {},
}));

const ORIGIN = "http://127.0.0.1:54321";

const state = {
  enabled: { "workbench.action.files.save": true },
  checked: {},
  radios: {},
  recentFiles: [],
  views: [],
  changedFiles: [],
};

describe("menu state from the page", () => {
  test("accepted from the window's own server", () => {
    const result = validateMenuState(
      `${ORIGIN}/?file=a.squiggle`,
      ORIGIN,
      state
    );
    expect(result).toEqual({ ok: true, state });
  });

  test("rejected from a foreign origin or an unknown frame", () => {
    for (const url of [
      "http://127.0.0.1:54322/",
      "http://localhost:54321/",
      "https://evil.example/",
      "file:///etc/passwd",
      "not a url",
      undefined,
    ]) {
      const result = validateMenuState(url, ORIGIN, state);
      expect(result.ok, String(url)).toBe(false);
    }
  });

  test("rejected when malformed", () => {
    for (const payload of [
      null,
      "state",
      { ...state, enabled: { x: "yes" } },
      { ...state, recentFiles: Array.from({ length: 9 }, (_, i) => `${i}`) },
      { ...state, views: [{ id: "output" }] },
      { enabled: {} },
    ]) {
      expect(
        validateMenuState(`${ORIGIN}/`, ORIGIN, payload).ok,
        JSON.stringify(payload)
      ).toBe(false);
    }
  });
});

describe("commands to the page", () => {
  test("an accelerator click is forwarded with viaKey: true", () => {
    expect(
      commandMessage("workbench.action.files.save", undefined, true)
    ).toEqual({
      id: "workbench.action.files.save",
      viaKey: true,
    });
    expect(
      commandMessage("squiggle.view.select", { id: "output" }, false)
    ).toEqual({
      id: "squiggle.view.select",
      args: { id: "output" },
      viaKey: false,
    });
    expect(commandMessage("undo", undefined, undefined).viaKey).toBe(false);

    // Through the menu template: the item's click builds the message.
    const sent: CommandMessage[] = [];
    const template = buildMenuTemplate({
      platform: "darwin",
      isPackaged: false,
      appName: "Squiggle Studio",
      state: {
        ...state,
        enabled: { "workbench.action.toggleSidebarVisibility": true },
      },
      recentFolders: [],
      currentRoot: undefined,
      home: "/Users/me",
      now: 0,
      sendToRenderer: (message) => sent.push(message),
      runInMain: () => undefined,
    });
    const view = template.find((m) => m.id === "view");
    const item = Array.isArray(view?.submenu)
      ? view.submenu.find(
          (i) => i.id === "view/workbench.action.toggleSidebarVisibility"
        )
      : undefined;
    item?.click?.({} as Electron.MenuItem, undefined, {
      triggeredByAccelerator: true,
    } as Electron.KeyboardEvent);
    expect(sent).toEqual([
      { id: "workbench.action.toggleSidebarVisibility", viaKey: true },
    ]);
  });

  test("ids the page doesn't handle are refused", () => {
    expect(() => commandMessage("no.such.command", undefined, false)).toThrow(
      /Unknown/
    );
    expect(() =>
      commandMessage("workbench.action.newWindow", undefined, false)
    ).toThrow(/main process/);
    expect(() =>
      commandMessage("workbench.action.files.openFolder", undefined, false)
    ).toThrow(/main process/);
  });
});

describe("runInPage", () => {
  test("answers, or gives up after the timeout", async () => {
    await expect(
      runInPage({ executeJavaScript: () => Promise.resolve(42) }, "1")
    ).resolves.toBe(42);
    await expect(
      runInPage(
        { executeJavaScript: () => new Promise(() => undefined) },
        "1",
        20
      )
    ).rejects.toThrow("timed out");
  });
});
