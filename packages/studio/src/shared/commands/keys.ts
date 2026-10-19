// Parsing, formatting and matching of key strings (VS Code syntax, see
// types.ts). Pure and DOM-free so that Node (tests, Electron main) can use it;
// `strokeFromEvent` takes any KeyboardEvent-like object.

import type { KeyBinding, KeyString, Platform } from "./types.js";

export type Stroke = {
  key: string; // canonical key name: "a", "1", "f6", "enter", "up", "`", "?", …
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean; // ⌘ on macOS, the Windows key elsewhere
};

const MODIFIER_ALIASES: Record<string, keyof Omit<Stroke, "key">> = {
  cmd: "meta",
  meta: "meta",
  win: "meta",
  ctrl: "ctrl",
  control: "ctrl",
  alt: "alt",
  option: "alt",
  shift: "shift",
};

const NAMED_KEYS = new Set([
  "enter",
  "escape",
  "tab",
  "space",
  "backspace",
  "delete",
  "insert",
  "up",
  "down",
  "left",
  "right",
  "home",
  "end",
  "pageup",
  "pagedown",
]);

const KEY_ALIASES: Record<string, string> = {
  esc: "escape",
  return: "enter",
  arrowup: "up",
  arrowdown: "down",
  arrowleft: "left",
  arrowright: "right",
  pgup: "pageup",
  pgdn: "pagedown",
};

const PUNCTUATION = new Set([
  "`",
  "-",
  "=",
  "[",
  "]",
  "\\",
  ";",
  "'",
  ",",
  ".",
  "/",
]);

function isFunctionKey(key: string): boolean {
  return /^f([1-9]|1[0-9]|2[0-4])$/.test(key);
}

function normalizeKeyName(raw: string, source: string): string {
  const lower = raw.toLowerCase();
  const key = KEY_ALIASES[lower] ?? lower;
  if (
    /^[a-z0-9]$/.test(key) ||
    isFunctionKey(key) ||
    NAMED_KEYS.has(key) ||
    PUNCTUATION.has(key) ||
    key === "?"
  ) {
    return key;
  }
  throw new Error(`Unknown key "${raw}" in "${source}"`);
}

function parseStroke(text: string, source: string): Stroke {
  // "cmd+-" and "ctrl+shift+-": a trailing "+" would be ambiguous, so the
  // key itself is never "+" (use "=" for the Plus/Equal key).
  const parts = text.split("+");
  const key = parts.pop();
  if (key === undefined || key === "") {
    throw new Error(`Missing key in "${source}"`);
  }
  const stroke: Stroke = {
    key: normalizeKeyName(key, source),
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
  };
  for (const part of parts) {
    const modifier = MODIFIER_ALIASES[part.toLowerCase()];
    if (!modifier) throw new Error(`Unknown modifier "${part}" in "${source}"`);
    stroke[modifier] = true;
  }
  return stroke;
}

// Parses "cmd+k cmd+s" into its strokes. Throws on malformed input.
export function parseKey(key: KeyString): Stroke[] {
  const strokes = key.trim().split(/\s+/);
  if (!strokes.length || strokes[0] === "") {
    throw new Error("Empty key string");
  }
  return strokes.map((s) => parseStroke(s, key));
}

// Canonical string for comparisons: modifiers in the order ctrl, alt, shift,
// cmd ("shift+cmd+p" and "cmd+shift+p" both become "shift+cmd+p").
export function strokeToString(stroke: Stroke): string {
  return [
    stroke.ctrl && "ctrl",
    stroke.alt && "alt",
    stroke.shift && "shift",
    stroke.meta && "cmd",
    stroke.key,
  ]
    .filter(Boolean)
    .join("+");
}

export function canonicalKey(key: KeyString): string {
  return parseKey(key).map(strokeToString).join(" ");
}

export function strokesEqual(a: Stroke, b: Stroke): boolean {
  return strokeToString(a) === strokeToString(b);
}

// A stroke with Ctrl, Alt or ⌘ (Shift alone doesn't count).
export function isModified(stroke: Stroke): boolean {
  return stroke.ctrl || stroke.alt || stroke.meta;
}

export function isFunctionKeyStroke(stroke: Stroke): boolean {
  return isFunctionKey(stroke.key);
}

// The key string of a binding on a platform (`win` also covers Linux unless
// `linux` is given).
export function keyForPlatform(
  binding: KeyBinding,
  platform: Platform
): KeyString | undefined {
  if (platform === "mac") return binding.mac;
  if (platform === "linux") return binding.linux ?? binding.win;
  return binding.win;
}

// ── Formatting ──────────────────────────────────────────────────────────────

const MAC_KEY_LABELS: Record<string, string> = {
  enter: "↵",
  escape: "Esc",
  tab: "Tab",
  space: "Space",
  backspace: "⌫",
  delete: "⌦",
  insert: "Ins",
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
  home: "Home",
  end: "End",
  pageup: "PgUp",
  pagedown: "PgDn",
};

const PC_KEY_LABELS: Record<string, string> = {
  enter: "Enter",
  escape: "Esc",
  tab: "Tab",
  space: "Space",
  backspace: "Backspace",
  delete: "Delete",
  insert: "Insert",
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
  home: "Home",
  end: "End",
  pageup: "PageUp",
  pagedown: "PageDown",
};

function keyLabel(key: string, platform: Platform): string {
  const labels = platform === "mac" ? MAC_KEY_LABELS : PC_KEY_LABELS;
  if (labels[key]) return labels[key];
  return key.length === 1 ? key.toUpperCase() : key.toUpperCase();
}

function formatStroke(stroke: Stroke, platform: Platform): string {
  const key = keyLabel(stroke.key, platform);
  if (platform === "mac") {
    // Apple order: ⌃⌥⇧⌘.
    return [
      stroke.ctrl && "⌃",
      stroke.alt && "⌥",
      stroke.shift && "⇧",
      stroke.meta && "⌘",
      key,
    ]
      .filter(Boolean)
      .join("");
  }
  // VS Code's order on Windows and Linux: Ctrl+Shift+Alt+Win.
  return [
    stroke.ctrl && "Ctrl",
    stroke.shift && "Shift",
    stroke.alt && "Alt",
    stroke.meta && (platform === "win" ? "Win" : "Super"),
    key,
  ]
    .filter(Boolean)
    .join("+");
}

// "⇧⌘P" on macOS, "Ctrl+Shift+P" elsewhere; chords are joined with a space
// ("⌘K ⌘S").
export function formatKey(key: KeyString, platform: Platform): string {
  return parseKey(key)
    .map((s) => formatStroke(s, platform))
    .join(" ");
}

const ELECTRON_KEY_NAMES: Record<string, string> = {
  enter: "Enter",
  escape: "Esc",
  tab: "Tab",
  space: "Space",
  backspace: "Backspace",
  delete: "Delete",
  insert: "Insert",
  up: "Up",
  down: "Down",
  left: "Left",
  right: "Right",
  home: "Home",
  end: "End",
  pageup: "PageUp",
  pagedown: "PageDown",
};

// An Electron menu accelerator ("Cmd+Shift+P"), or undefined for chords
// (Electron can't display them) and for unmodified keys other than F1–F24
// (a native accelerator for "?" would swallow typing).
export function toElectronAccelerator(
  key: KeyString,
  platform: Platform
): string | undefined {
  const strokes = parseKey(key);
  if (strokes.length !== 1) return undefined;
  const [stroke] = strokes;
  if (!isModified(stroke) && !isFunctionKey(stroke.key)) return undefined;
  const name =
    ELECTRON_KEY_NAMES[stroke.key] ??
    (stroke.key.length === 1
      ? stroke.key.toUpperCase()
      : stroke.key.toUpperCase());
  return [
    stroke.meta && (platform === "mac" ? "Cmd" : "Super"),
    stroke.ctrl && "Ctrl",
    stroke.alt && "Alt",
    stroke.shift && "Shift",
    name,
  ]
    .filter(Boolean)
    .join("+");
}

const ARIA_KEY_NAMES: Record<string, string> = {
  enter: "Enter",
  escape: "Escape",
  tab: "Tab",
  space: "Space",
  backspace: "Backspace",
  delete: "Delete",
  insert: "Insert",
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  home: "Home",
  end: "End",
  pageup: "PageUp",
  pagedown: "PageDown",
};

// The `aria-keyshortcuts` value ("Meta+Shift+P"). ARIA has no syntax for key
// sequences (a space separates alternatives), so chords give "" and callers
// omit the attribute.
export function toAriaKeyshortcuts(key: KeyString, platform: Platform): string {
  const strokes = parseKey(key);
  if (strokes.length !== 1) return "";
  const [stroke] = strokes;
  void platform; // ⌘ is "Meta" on macOS, and the Windows key is "Meta" too
  const name =
    ARIA_KEY_NAMES[stroke.key] ??
    (stroke.key.length === 1
      ? stroke.key.toUpperCase()
      : stroke.key.toUpperCase());
  return [
    stroke.ctrl && "Control",
    stroke.alt && "Alt",
    stroke.shift && "Shift",
    stroke.meta && "Meta",
    name,
  ]
    .filter(Boolean)
    .join("+");
}

// ── Keys a browser tab never sees (or must not take) ────────────────────────

const PC_RESERVED: KeyString[] = [
  "ctrl+w",
  "ctrl+shift+w",
  "ctrl+n",
  "ctrl+shift+n",
  "ctrl+t",
  "ctrl+shift+t",
  "ctrl+tab",
  "ctrl+shift+tab",
  "ctrl+pageup",
  "ctrl+pagedown",
  "ctrl+f4",
  "alt+f4",
  "ctrl+h",
];

// `all`: forbidden for every browser-host binding. `firefox`: allowed only
// when the same command has another browser binding on neither list.
export const BROWSER_RESERVED: Record<
  Platform,
  { all: KeyString[]; firefox: KeyString[] }
> = {
  mac: {
    all: [
      "cmd+w",
      "shift+cmd+w",
      "cmd+n",
      "shift+cmd+n",
      "cmd+t",
      "shift+cmd+t",
      "cmd+q",
      "ctrl+tab",
      "ctrl+shift+tab",
      "alt+cmd+left",
      "alt+cmd+right",
      "shift+cmd+[",
      "shift+cmd+]",
    ],
    firefox: ["shift+cmd+p"],
  },
  win: { all: PC_RESERVED, firefox: ["ctrl+shift+p"] },
  linux: {
    all: [...PC_RESERVED, ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `alt+${n}`)],
    firefox: ["ctrl+shift+p"],
  },
};

// ── Keyboard events ─────────────────────────────────────────────────────────

// The subset of KeyboardEvent that `strokeFromEvent` reads.
export type KeyEventLike = {
  key: string;
  code: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  getModifierState?: (key: string) => boolean;
};

const MODIFIER_KEYS = new Set([
  "Meta",
  "Control",
  "Alt",
  "AltGraph",
  "Shift",
  "CapsLock",
  "OS",
  "Fn",
  "FnLock",
  "Hyper",
  "Super",
  "Symbol",
]);

const CODE_KEYS: Record<string, string> = {
  Backquote: "`",
  Minus: "-",
  Equal: "=",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
  Semicolon: ";",
  Quote: "'",
  Comma: ",",
  Period: ".",
  Slash: "/",
};

const EVENT_KEYS: Record<string, string> = {
  Enter: "enter",
  Escape: "escape",
  Esc: "escape",
  Tab: "tab",
  " ": "space",
  Spacebar: "space",
  Backspace: "backspace",
  Delete: "delete",
  Insert: "insert",
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  Up: "up",
  Down: "down",
  Left: "left",
  Right: "right",
  Home: "home",
  End: "end",
  PageUp: "pageup",
  PageDown: "pagedown",
};

export function isModifierKeyEvent(e: Pick<KeyEventLike, "key">): boolean {
  return MODIFIER_KEYS.has(e.key);
}

// Normalizes a keydown into a Stroke (§4.6 step 2), or undefined for modifier
// keys and for AltGr chords on Windows/Linux (nothing with Ctrl or Alt
// matches them).
// - Letters: `e.key` when it is one ASCII letter (Dvorak and AZERTY users press
//   their own letter), else `e.code` (macOS Option rewriting "⌥S" → "ß",
//   Cyrillic and other layouts).
// - Digits and punctuation: `e.code`, positional.
// - "?": `e.key === "?"` without Ctrl, Alt or ⌘ (Shift is how it is typed).
// - Named keys: `e.key`.
export function strokeFromEvent(
  e: KeyEventLike,
  platform: Platform
): Stroke | undefined {
  if (isModifierKeyEvent(e)) return undefined;
  if (
    platform !== "mac" &&
    (e.ctrlKey || e.altKey) &&
    e.getModifierState?.("AltGraph")
  ) {
    return undefined;
  }
  const mods = {
    ctrl: e.ctrlKey,
    alt: e.altKey,
    shift: e.shiftKey,
    meta: e.metaKey,
  };
  if (e.key === "?" && !e.ctrlKey && !e.altKey && !e.metaKey) {
    return { key: "?", ctrl: false, alt: false, shift: false, meta: false };
  }
  if (/^[a-zA-Z]$/.test(e.key)) return { key: e.key.toLowerCase(), ...mods };
  const letter = /^Key([A-Z])$/.exec(e.code);
  if (letter) return { key: letter[1].toLowerCase(), ...mods };
  const digit = /^Digit([0-9])$/.exec(e.code);
  if (digit) return { key: digit[1], ...mods };
  if (CODE_KEYS[e.code]) return { key: CODE_KEYS[e.code], ...mods };
  if (EVENT_KEYS[e.key]) return { key: EVENT_KEYS[e.key], ...mods };
  const fn = /^F([1-9]|1[0-9]|2[0-4])$/.exec(e.key);
  if (fn) return { key: `f${fn[1]}`, ...mods };
  if (e.code === "Space") return { key: "space", ...mods };
  return { key: e.key.toLowerCase(), ...mods };
}
