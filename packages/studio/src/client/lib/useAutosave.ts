// Autosave (§2.5): `files.autoSave` is "afterDelay" (default), "onFocusChange"
// or "off"; `files.autoSaveDelay` defaults to 1000 ms (200–60000).
//
// - afterDelay saves `autoSaveDelay` ms after the last edit of a file, and
//   flushes every file immediately when the window blurs (the moment the user
//   switches to the terminal to prompt the agent), the page is hidden or
//   unloaded, the shown file changes, a file closes or the folder switches.
// - onFocusChange: the same flushes, plus focus leaving the editor region;
//   no timer.
// - Never while the file isn't loaded, has a conflict, was deleted on disk
//   (saving would resurrect a file the agent deleted), the folder was
//   switched or is missing, the buffer equals the disk, or a `.json` buffer
//   doesn't parse. Broken Squiggle code *is* saved.
//
// The scheduler is plain TypeScript (tests drive it with fake timers); the
// workspace owns one and installs the window listeners with
// installAutosaveTriggers().

import {
  AUTO_SAVE_DELAY_MAX,
  AUTO_SAVE_DELAY_MIN,
} from "../../shared/settings.js";
import type { OpenFile } from "./workspaceTypes.js";

export type AutosaveMode = "afterDelay" | "onFocusChange" | "off";

export type AutosaveBlocker =
  | "not-ready"
  | "conflict"
  | "deleted"
  | "root-changed"
  | "root-missing"
  | "clean"
  | "invalid-json";

// Why autosave must not write this file now, or undefined when it may.
export function autosaveBlocker(
  file: OpenFile,
  root: { rootChanged: boolean; rootMissing: boolean }
): AutosaveBlocker | undefined {
  if (file.status !== "ready") return "not-ready";
  if (file.conflict) return "conflict";
  if (file.deletedOnDisk) return "deleted";
  if (root.rootChanged) return "root-changed";
  if (root.rootMissing) return "root-missing";
  if (file.buffer === file.disk) return "clean";
  if (file.path.endsWith(".json") && !parsesAsJson(file.buffer)) {
    return "invalid-json";
  }
  return undefined;
}

function parsesAsJson(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

export function clampAutosaveDelay(ms: number): number {
  return Math.min(AUTO_SAVE_DELAY_MAX, Math.max(AUTO_SAVE_DELAY_MIN, ms));
}

export type AutosaveSchedulerOptions = {
  // Saves the file now (the workspace serializes saves per file).
  save: (path: string, opts: { keepalive: boolean }) => void;
  // Whether autosave may write the file now (autosaveBlocker() is undefined).
  canSave: (path: string) => boolean;
  // Called whenever the set of pending timers changes (busy reporting,
  // "Saving…" in the status bar).
  onPendingChange?: (pending: ReadonlySet<string>) => void;
};

export class AutosaveScheduler {
  private mode: AutosaveMode = "afterDelay";
  private delayMs = 1000;
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(private readonly opts: AutosaveSchedulerOptions) {}

  configure(mode: AutosaveMode, delayMs: number): void {
    const delay = clampAutosaveDelay(delayMs);
    if (mode === this.mode && delay === this.delayMs) return;
    this.mode = mode;
    this.delayMs = delay;
    if (mode !== "afterDelay") this.cancelAll();
  }

  getMode(): AutosaveMode {
    return this.mode;
  }

  // A file's buffer changed: (re)start its timer in afterDelay mode.
  edited(path: string): void {
    if (this.mode !== "afterDelay") return;
    this.cancel(path, false);
    if (!this.opts.canSave(path)) {
      this.notify();
      return;
    }
    this.timers.set(
      path,
      setTimeout(() => {
        this.timers.delete(path);
        this.notify();
        if (this.opts.canSave(path)) {
          this.opts.save(path, { keepalive: false });
        }
      }, this.delayMs)
    );
    this.notify();
  }

  // Saves the given files (or every file with a pending timer when `paths`
  // is omitted) now, unless autosave is off. Returns the paths it saved.
  flush(
    paths: readonly string[],
    opts: { keepalive?: boolean } = {}
  ): string[] {
    if (this.mode === "off") return [];
    const saved: string[] = [];
    for (const path of paths) {
      this.cancel(path, false);
      if (this.opts.canSave(path)) {
        this.opts.save(path, { keepalive: opts.keepalive ?? false });
        saved.push(path);
      }
    }
    this.notify();
    return saved;
  }

  isPending(path: string): boolean {
    return this.timers.has(path);
  }

  pendingPaths(): string[] {
    return [...this.timers.keys()];
  }

  cancel(path: string, notify = true): void {
    const timer = this.timers.get(path);
    if (timer === undefined) return;
    clearTimeout(timer);
    this.timers.delete(path);
    if (notify) this.notify();
  }

  cancelAll(): void {
    if (!this.timers.size) return;
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    this.notify();
  }

  rename(from: string, to: string): void {
    if (!this.timers.has(from)) return;
    this.cancel(from, false);
    this.edited(to);
  }

  private notify() {
    this.opts.onPendingChange?.(new Set(this.timers.keys()));
  }
}

// The flush triggers that come from the window (§2.5). `flush` saves every
// eligible dirty file (keepalive requests for "hidden" and "pagehide", which
// outlive the page); `leftEditor` is focus leaving the editor region (used
// by onFocusChange). `beforeUnload` returns true when every unsaved buffer
// is now being written with a keepalive request, so the page needn't prompt.
export type FlushReason = "blur" | "hidden" | "pagehide";

export function installAutosaveTriggers(handlers: {
  flush: (reason: FlushReason) => void;
  leftEditor: () => void;
  beforeUnload: () => boolean;
  win?: Window;
  doc?: Document;
}): () => void {
  const win = handlers.win ?? window;
  const doc = handlers.doc ?? document;
  const onBlur = () => handlers.flush("blur");
  const onVisibility = () => {
    if (doc.visibilityState === "hidden") handlers.flush("hidden");
  };
  const onPageHide = () => handlers.flush("pagehide");
  // Capture phase, so this runs before App's prompt handler: when every
  // unsaved buffer is being written (keepalive requests outlive the page),
  // there is nothing to prompt about and App's handler is skipped (§2.5:
  // prompt only if a buffer is still dirty after the flush was attempted).
  const onBeforeUnload = (e: Event) => {
    if (handlers.beforeUnload()) e.stopImmediatePropagation();
  };
  const onFocusOut = (e: FocusEvent) => {
    const from = e.target instanceof Element ? e.target : null;
    if (!from?.closest('[data-studio-region="editor"]')) return;
    const to = e.relatedTarget instanceof Element ? e.relatedTarget : null;
    if (to?.closest('[data-studio-region="editor"]')) return;
    handlers.leftEditor();
  };
  win.addEventListener("blur", onBlur);
  doc.addEventListener("visibilitychange", onVisibility);
  win.addEventListener("pagehide", onPageHide);
  win.addEventListener("beforeunload", onBeforeUnload, { capture: true });
  doc.addEventListener("focusout", onFocusOut, true);
  return () => {
    win.removeEventListener("blur", onBlur);
    doc.removeEventListener("visibilitychange", onVisibility);
    win.removeEventListener("pagehide", onPageHide);
    win.removeEventListener("beforeunload", onBeforeUnload, { capture: true });
    doc.removeEventListener("focusout", onFocusOut, true);
  };
}
