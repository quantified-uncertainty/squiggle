// The key dispatcher (§4.6): one capture-phase keydown listener on `window`.
//
// 1. Ignores IME composition.
// 2. Normalizes the stroke (keys.ts: strokeFromEvent).
// 3. Chords: ⌘K / Ctrl+K starts one (a pill shows it, ChordIndicator.tsx);
//    the next non-modifier key resolves it; Esc, an unbound key or a
//    pointerdown cancels (the cancelling key is swallowed). No timeout.
// 4. While an overlay or menu is open, a stroke that matches any Studio
//    binding is only prevented (no print or save dialogs); the overlay's own
//    handlers see it.
// 5. Browser host: F10 focuses the menubar; on Windows/Linux so does tapping
//    Alt alone.
// 6. Candidates: bindings for this platform and host whose stroke matches,
//    whose `when` and precondition hold and whose command has a handler.
//    `display` bindings and owner "region" are never dispatched; owner
//    "codemirror" not while the editor has focus; in Electron, main-owned
//    and role commands are left to their native accelerators. The last
//    declared binding wins.
// 7. Bare keys are never global: only strokes with Cmd, Ctrl or Alt, F1–F24
//    and `?` (outside editors and inputs) are dispatched.
// 8. On a match: preventDefault, stopPropagation, run (auto-repeat runs only
//    repeatable commands).
// 9. ⌘S / Ctrl+S is always prevented, even with nothing to save.
//
// The dispatcher doesn't import the registry; CommandsProvider passes it in.

import {
  bindingsFor,
  type CommandSpec,
  isFunctionKeyStroke,
  isModified,
  type KeyBinding,
  keyForPlatform,
  parseKey,
  type Stroke,
  strokeFromEvent,
  strokeToString,
} from "../../shared/commands/index.js";
import { host } from "../lib/host.js";
import { evaluateWhen, type WhenContext } from "./when.js";

export type DispatcherRuntime = {
  commands: readonly CommandSpec[];
  isEnabled(id: string): boolean; // precondition holds and a handler is mounted
  run(id: string, args: unknown): boolean;
  getContext(): WhenContext;
};

type Compiled = {
  spec: CommandSpec;
  binding: KeyBinding;
  strokes: Stroke[];
  key: string; // canonical, strokes joined by a space
  first: string; // canonical first stroke
};

const MENUBAR_COMMAND = "squiggle.focusMenuBar";

function compile(
  commands: readonly CommandSpec[],
  platform: typeof host.platform,
  hostKind: typeof host.kind
): Compiled[] {
  const out: Compiled[] = [];
  for (const spec of commands) {
    for (const binding of bindingsFor(spec, platform, hostKind)) {
      const key = keyForPlatform(binding, platform);
      if (!key) continue;
      const strokes = parseKey(key);
      out.push({
        spec,
        binding,
        strokes,
        key: strokes.map(strokeToString).join(" "),
        first: strokeToString(strokes[0]),
      });
    }
  }
  // Declaration order across the manifest: later bindings win ties.
  return out;
}

// Rule 7: only modified strokes, function keys and `?` start a global key.
export function isDispatchableStroke(stroke: Stroke): boolean {
  return (
    isModified(stroke) || isFunctionKeyStroke(stroke) || stroke.key === "?"
  );
}

// ── Pending chord (read by ChordIndicator) ─────────────────────────────────

let pendingChord: string | null = null;
const chordListeners = new Set<() => void>();

function setPendingChord(value: string | null) {
  if (pendingChord === value) return;
  pendingChord = value;
  for (const cb of [...chordListeners]) cb();
}

export function getPendingChord(): string | null {
  return pendingChord;
}

export function subscribeChord(cb: () => void): () => void {
  chordListeners.add(cb);
  return () => {
    chordListeners.delete(cb);
  };
}

// ── The listener ───────────────────────────────────────────────────────────

export function installDispatcher(runtime: DispatcherRuntime): () => void {
  let compiledFor = "";
  let compiled: Compiled[] = [];
  let prefixes = new Set<string>();
  let altArmed = false;

  const bindings = () => {
    const id = `${host.platform}:${host.kind}`;
    if (id !== compiledFor) {
      compiled = compile(runtime.commands, host.platform, host.kind);
      prefixes = new Set(
        compiled.filter((c) => c.strokes.length > 1).map((c) => c.first)
      );
      compiledFor = id;
    }
    return compiled;
  };

  const isCandidate = (c: Compiled, ctx: WhenContext): boolean => {
    const { spec, binding } = c;
    if (binding.display) return false;
    if (spec.owner === "region") return false;
    if (spec.owner === "codemirror" && ctx["editorTextFocus"]) return false;
    if (
      host.kind === "electron" &&
      (spec.owner === "main" ||
        spec.owner === "role" ||
        spec.electronOwner === "main")
    ) {
      return false;
    }
    if (!isDispatchableStroke(c.strokes[0])) return false;
    if (
      c.strokes[0].key === "?" &&
      (ctx["editorTextFocus"] || ctx["textInputFocus"])
    ) {
      return false;
    }
    if (!evaluateWhen(binding.when, ctx)) return false;
    return runtime.isEnabled(spec.id);
  };

  const findMatch = (key: string, ctx: WhenContext): Compiled | undefined => {
    let match: Compiled | undefined;
    for (const c of bindings()) {
      if (c.key === key && isCandidate(c, ctx)) match = c;
    }
    return match;
  };

  const matchesAnyBinding = (stroke: string): boolean =>
    bindings().some(
      (c) =>
        !c.binding.display &&
        c.spec.owner !== "region" &&
        isDispatchableStroke(c.strokes[0]) &&
        c.first === stroke
    );

  const runMatch = (match: Compiled, e: KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.repeat && !match.spec.repeatable) return;
    runtime.run(match.spec.id, match.binding.args ?? match.spec.args);
  };

  const focusMenubar = (): boolean =>
    runtime.isEnabled(MENUBAR_COMMAND) &&
    runtime.run(MENUBAR_COMMAND, undefined);

  const onKeyDown = (e: KeyboardEvent) => {
    // 1. IME composition.
    if (e.isComposing || e.keyCode === 229) return;

    // Alt tap (Windows/Linux, browser): an Alt keydown with no other
    // modifier arms it; anything else disarms.
    if (e.key === "Alt") {
      altArmed =
        host.kind === "web" &&
        host.platform !== "mac" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.repeat;
      return;
    }
    altArmed = false;

    // 2. Normalize.
    const stroke = strokeFromEvent(e, host.platform);
    if (!stroke) return;
    const canonical = strokeToString(stroke);
    const ctx = runtime.getContext();
    const overlay = Boolean(ctx["overlayOpen"]) || Boolean(ctx["menuOpen"]);
    const save = host.platform === "mac" ? "cmd+s" : "ctrl+s";
    bindings();

    // 3. Resolve a pending chord.
    if (pendingChord !== null) {
      const prefix = pendingChord;
      e.preventDefault();
      e.stopPropagation();
      if (e.repeat && canonical === prefix) return; // still holding ⌘K
      setPendingChord(null);
      if (overlay || canonical === "escape") return;
      const match = findMatch(`${prefix} ${canonical}`, ctx);
      if (match && !(e.repeat && !match.spec.repeatable)) {
        runtime.run(match.spec.id, match.binding.args ?? match.spec.args);
      }
      return;
    }

    // 4. Overlay or menu open.
    if (overlay) {
      if (canonical === save || matchesAnyBinding(canonical))
        e.preventDefault();
      return;
    }

    // 5. Menubar entry.
    if (host.kind === "web" && canonical === "f10") {
      if (focusMenubar()) {
        e.preventDefault();
        e.stopPropagation();
      }
      return;
    }

    // 3. Start a chord.
    if (prefixes.has(canonical)) {
      e.preventDefault();
      e.stopPropagation();
      setPendingChord(canonical);
      return;
    }

    // 6–8. A single-stroke binding.
    const match = findMatch(canonical, ctx);
    if (match) {
      runMatch(match, e);
      return;
    }

    // 9. Never the browser's Save Page dialog.
    if (canonical === save) e.preventDefault();
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key !== "Alt" || !altArmed) return;
    altArmed = false;
    const ctx = runtime.getContext();
    if (ctx["overlayOpen"] || ctx["menuOpen"]) return;
    if (focusMenubar()) e.preventDefault();
  };

  const onPointerDown = () => {
    altArmed = false;
    if (pendingChord !== null) setPendingChord(null);
  };

  const onBlur = () => {
    altArmed = false;
  };

  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("keyup", onKeyUp, true);
  window.addEventListener("pointerdown", onPointerDown, true);
  window.addEventListener("blur", onBlur);
  return () => {
    window.removeEventListener("keydown", onKeyDown, true);
    window.removeEventListener("keyup", onKeyUp, true);
    window.removeEventListener("pointerdown", onPointerDown, true);
    window.removeEventListener("blur", onBlur);
    setPendingChord(null);
  };
}
