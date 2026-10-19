import { describe, expect, test } from "vitest";

import {
  bindingsFor,
  canonicalKey,
  formatKey,
  getCommand,
  type KeyEventLike,
  keyForPlatform,
  parseKey,
  strokeFromEvent,
  strokeToString,
  toAriaKeyshortcuts,
  toElectronAccelerator,
} from "../src/shared/commands/index.js";

const ev = (init: Partial<KeyEventLike> & { key: string; code?: string }) => ({
  code: "",
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  metaKey: false,
  ...init,
});

describe("parseKey", () => {
  test("modifiers, keys and chords", () => {
    expect(parseKey("cmd+shift+p")).toEqual([
      { key: "p", ctrl: false, alt: false, shift: true, meta: true },
    ]);
    expect(parseKey("ctrl+k ctrl+s").map(strokeToString)).toEqual([
      "ctrl+k",
      "ctrl+s",
    ]);
    expect(parseKey("ctrl+`")[0].key).toBe("`");
    expect(parseKey("cmd+-")[0].key).toBe("-");
    expect(parseKey("cmd+\\")[0].key).toBe("\\");
    expect(parseKey("?")[0]).toEqual({
      key: "?",
      ctrl: false,
      alt: false,
      shift: false,
      meta: false,
    });
    expect(parseKey("shift+f6")[0].key).toBe("f6");
    expect(parseKey("esc")[0].key).toBe("escape");
  });

  test("modifier order doesn't matter", () => {
    expect(canonicalKey("shift+cmd+p")).toBe(canonicalKey("cmd+shift+p"));
    expect(canonicalKey("alt+shift+f")).toBe("alt+shift+f");
  });

  test("rejects malformed keys", () => {
    expect(() => parseKey("")).toThrow();
    expect(() => parseKey("cmd+")).toThrow();
    expect(() => parseKey("hyper+x")).toThrow(/modifier/);
    expect(() => parseKey("cmd+banana")).toThrow(/Unknown key/);
  });
});

describe("formatKey", () => {
  test("macOS uses Apple order ⌃⌥⇧⌘", () => {
    expect(formatKey("cmd+shift+p", "mac")).toBe("⇧⌘P");
    expect(formatKey("shift+alt+f", "mac")).toBe("⌥⇧F");
    expect(formatKey("ctrl+cmd+f", "mac")).toBe("⌃⌘F");
    expect(formatKey("cmd+k cmd+s", "mac")).toBe("⌘K ⌘S");
    expect(formatKey("cmd+k shift+p", "mac")).toBe("⌘K ⇧P");
    expect(formatKey("cmd+enter", "mac")).toBe("⌘↵");
    expect(formatKey("ctrl+-", "mac")).toBe("⌃-");
    expect(formatKey("alt+f5", "mac")).toBe("⌥F5");
    expect(formatKey("?", "mac")).toBe("?");
  });

  test("Windows and Linux spell modifiers out", () => {
    expect(formatKey("ctrl+shift+p", "win")).toBe("Ctrl+Shift+P");
    expect(formatKey("shift+alt+f", "win")).toBe("Shift+Alt+F");
    expect(formatKey("ctrl+k s", "win")).toBe("Ctrl+K S");
    expect(formatKey("alt+left", "linux")).toBe("Alt+←");
    expect(formatKey("ctrl+enter", "win")).toBe("Ctrl+Enter");
  });
});

describe("toElectronAccelerator", () => {
  test("single strokes", () => {
    expect(toElectronAccelerator("cmd+shift+p", "mac")).toBe("Cmd+Shift+P");
    expect(toElectronAccelerator("ctrl+shift+p", "win")).toBe("Ctrl+Shift+P");
    expect(toElectronAccelerator("ctrl+cmd+f", "mac")).toBe("Cmd+Ctrl+F");
    expect(toElectronAccelerator("f11", "win")).toBe("F11");
    expect(toElectronAccelerator("cmd+enter", "mac")).toBe("Cmd+Enter");
    expect(toElectronAccelerator("ctrl+`", "mac")).toBe("Ctrl+`");
  });

  test("chords and unmodified keys get none", () => {
    expect(toElectronAccelerator("cmd+k cmd+s", "mac")).toBeUndefined();
    expect(toElectronAccelerator("?", "mac")).toBeUndefined();
    expect(toElectronAccelerator("enter", "win")).toBeUndefined();
  });
});

describe("toAriaKeyshortcuts", () => {
  test("ARIA key names", () => {
    expect(toAriaKeyshortcuts("cmd+s", "mac")).toBe("Meta+S");
    expect(toAriaKeyshortcuts("cmd+shift+p", "mac")).toBe("Shift+Meta+P");
    expect(toAriaKeyshortcuts("ctrl+shift+p", "win")).toBe("Control+Shift+P");
    expect(toAriaKeyshortcuts("alt+left", "win")).toBe("Alt+ArrowLeft");
    expect(toAriaKeyshortcuts("f6", "win")).toBe("F6");
  });

  test("chords have no ARIA form", () => {
    expect(toAriaKeyshortcuts("cmd+k p", "mac")).toBe("");
  });
});

describe("strokeFromEvent", () => {
  const s = (e: KeyEventLike, platform: "mac" | "win" | "linux" = "mac") => {
    const stroke = strokeFromEvent(e, platform);
    return stroke && strokeToString(stroke);
  };

  test("letters prefer e.key, so Dvorak and AZERTY users press their letter", () => {
    // Dvorak: the physical KeyL key types "s".
    expect(s(ev({ key: "s", code: "KeyL", metaKey: true }))).toBe("cmd+s");
    // AZERTY: the physical KeyQ key types "a".
    expect(s(ev({ key: "a", code: "KeyQ", ctrlKey: true }), "win")).toBe(
      "ctrl+a"
    );
    expect(
      s(ev({ key: "P", code: "KeyP", metaKey: true, shiftKey: true }))
    ).toBe("shift+cmd+p");
  });

  test("macOS Option rewriting falls back to e.code (⌥S types ß)", () => {
    expect(s(ev({ key: "ß", code: "KeyS", altKey: true, metaKey: true }))).toBe(
      "alt+cmd+s"
    );
    expect(
      s(ev({ key: "Ï", code: "KeyF", altKey: true, shiftKey: true }))
    ).toBe("alt+shift+f");
    // A dead key (⌥⌘N on a US layout reports "Dead").
    expect(
      s(ev({ key: "Dead", code: "KeyN", altKey: true, metaKey: true }))
    ).toBe("alt+cmd+n");
  });

  test("non-Latin layouts fall back to e.code (Cyrillic)", () => {
    expect(s(ev({ key: "ы", code: "KeyS", metaKey: true }))).toBe("cmd+s");
    expect(s(ev({ key: "з", code: "KeyP", ctrlKey: true }), "linux")).toBe(
      "ctrl+p"
    );
  });

  test("digits and punctuation are positional (e.code)", () => {
    expect(s(ev({ key: "`", code: "Backquote", ctrlKey: true }))).toBe(
      "ctrl+`"
    );
    // German layout: the Backquote position types "^".
    expect(s(ev({ key: "^", code: "Backquote", ctrlKey: true }))).toBe(
      "ctrl+`"
    );
    expect(
      s(ev({ key: "!", code: "Digit1", metaKey: true, shiftKey: true }))
    ).toBe("shift+cmd+1");
    expect(s(ev({ key: "\\", code: "Backslash", metaKey: true }))).toBe(
      "cmd+\\"
    );
    expect(
      s(ev({ key: "_", code: "Minus", ctrlKey: true, shiftKey: true }))
    ).toBe("ctrl+shift+-");
  });

  test("? comes from e.key without Ctrl, Alt or ⌘", () => {
    expect(s(ev({ key: "?", code: "Slash", shiftKey: true }))).toBe("?");
    expect(
      s(ev({ key: "?", code: "Slash", shiftKey: true, metaKey: true }))
    ).toBe("shift+cmd+/");
  });

  test("named keys", () => {
    expect(
      s(ev({ key: "ArrowLeft", code: "ArrowLeft", altKey: true }), "win")
    ).toBe("alt+left");
    expect(s(ev({ key: "F6", code: "F6", shiftKey: true }))).toBe("shift+f6");
    expect(s(ev({ key: "Enter", code: "NumpadEnter", metaKey: true }))).toBe(
      "cmd+enter"
    );
    expect(s(ev({ key: " ", code: "Space", ctrlKey: true }))).toBe(
      "ctrl+space"
    );
    expect(s(ev({ key: "Escape", code: "Escape" }))).toBe("escape");
  });

  test("modifier keys alone are not strokes", () => {
    expect(
      strokeFromEvent(
        ev({ key: "Meta", code: "MetaLeft", metaKey: true }),
        "mac"
      )
    ).toBeUndefined();
    expect(
      strokeFromEvent(
        ev({ key: "Shift", code: "ShiftLeft", shiftKey: true }),
        "mac"
      )
    ).toBeUndefined();
  });

  test("AltGr chords never match on Windows/Linux", () => {
    const altGr = ev({
      key: "@",
      code: "KeyQ",
      ctrlKey: true,
      altKey: true,
      getModifierState: (k: string) => k === "AltGraph",
    });
    expect(strokeFromEvent(altGr, "win")).toBeUndefined();
    expect(strokeFromEvent(altGr, "linux")).toBeUndefined();
    // On macOS Option is a plain modifier.
    expect(strokeFromEvent(altGr, "mac")).toBeDefined();
  });
});

describe("bindingsFor", () => {
  const keys = (
    id: string,
    platform: "mac" | "win" | "linux",
    host: "web" | "electron"
  ) =>
    bindingsFor(getCommand(id)!, platform, host).map((b) =>
      keyForPlatform(b, platform)
    );

  test("Electron shows its own binding first; a browser never sees it", () => {
    const close = "workbench.action.closeActiveEditor";
    expect(keys(close, "mac", "electron")).toEqual(["cmd+w", "ctrl+w"]);
    expect(keys(close, "mac", "web")).toEqual(["ctrl+w"]);
    expect(keys(close, "win", "electron")).toEqual(["ctrl+w", "alt+w"]);
    expect(keys(close, "win", "web")).toEqual(["alt+w"]);
  });

  test("the switcher: ⌃Tab only in Electron", () => {
    const id = "workbench.action.quickOpenPreviousRecentlyUsedEditor";
    expect(keys(id, "mac", "electron")).toEqual(["ctrl+tab", "ctrl+`"]);
    expect(keys(id, "mac", "web")).toEqual(["ctrl+`"]);
  });

  test("Linux falls back to the Windows key", () => {
    expect(keys("workbench.action.files.saveAll", "linux", "web")).toEqual([
      "ctrl+k s",
    ]);
    expect(keys("workbench.action.files.saveAll", "mac", "web")).toEqual([
      "alt+cmd+s",
    ]);
  });

  test("platform-only bindings", () => {
    expect(keys("workbench.action.navigateBack", "mac", "web")).toEqual([
      "ctrl+-",
    ]);
    expect(keys("workbench.action.navigateBack", "win", "web")).toEqual([
      "alt+left",
    ]);
    expect(keys("workbench.action.openRecent", "win", "web")).toEqual([]);
    expect(keys("workbench.action.openRecent", "win", "electron")).toEqual([
      "ctrl+r",
    ]);
  });
});
