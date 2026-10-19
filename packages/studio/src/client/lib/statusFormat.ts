// The status bar's texts and states (§3.8), as pure functions so every state
// is unit-tested (test/statusFormat.test.ts). StatusBar.tsx renders them.

import type { StudioSettings } from "../../shared/settings.js";
import type { ActiveRun } from "./stores/activeRun.js";
import type { Cursor } from "./stores/cursor.js";
import type { ChangeEntry, SaveState } from "./workspaceTypes.js";

// Red, amber or neutral text.
export type Tone = "normal" | "muted" | "warning" | "error" | "active";

export type StatusText = {
  state: string; // data-state
  text: string;
  title: string; // tooltip
  tone: Tone;
};

const basename = (path: string) => path.slice(path.lastIndexOf("/") + 1);
const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;
const withKey = (text: string, key: string | undefined) =>
  key ? `${text} · ${key}` : text;

// ── connection ─────────────────────────────────────────────────────────────

export type ConnectionState =
  | "live"
  | "reconnecting"
  | "resyncing"
  | "root-missing";

export function connectionStatus(
  connection: "live" | "reconnecting" | "resyncing",
  rootMissing: boolean
): StatusText & { state: ConnectionState } {
  if (rootMissing) {
    return {
      state: "root-missing",
      text: "Folder missing",
      title:
        "The open folder was moved or deleted. Unsaved edits are kept in this window.",
      tone: "error",
    };
  }
  switch (connection) {
    case "live":
      return {
        state: "live",
        text: "Live",
        title:
          "Connected. Changes to files on disk (e.g. by a coding agent) show up automatically. Click to refresh.",
        tone: "normal",
      };
    case "reconnecting":
      return {
        state: "reconnecting",
        text: "Reconnecting…",
        title: "Lost the connection to the Studio server. Retrying…",
        tone: "warning",
      };
    case "resyncing":
      return {
        state: "resyncing",
        text: "Resyncing…",
        title: "Checking the folder for changes made while disconnected",
        tone: "warning",
      };
  }
}

// ── follow ─────────────────────────────────────────────────────────────────

export function followStatus(
  on: boolean,
  key: string | undefined
): StatusText & { state: "on" | "off" } {
  const hint = key ? ` (${key})` : "";
  return on
    ? {
        state: "on",
        text: "Following",
        title: `Following changes on disk: files a coding agent edits are shown as they change. Click to stop${hint}`,
        tone: "active",
      }
    : {
        state: "off",
        text: "Follow",
        title: `Follow changes on disk: show files as a coding agent edits them${hint}`,
        tone: "muted",
      };
}

// ── changes ────────────────────────────────────────────────────────────────

// Unseen changes, newest first.
export function unseenChanges(
  changes: Record<string, ChangeEntry>
): Array<[string, ChangeEntry]> {
  return Object.entries(changes)
    .filter(([, c]) => !c.seen)
    .sort((a, b) => b[1].at - a[1].at);
}

// Hidden (undefined) when there are no unseen changes and no held-back
// Follow switch.
export function changesStatus(
  changes: Record<string, ChangeEntry>,
  followNotice: { path: string; at: number } | undefined,
  key: string | undefined // ⌥F5
): (StatusText & { state: "changed" | "held"; count: number }) | undefined {
  const unseen = unseenChanges(changes);
  const count = unseen.length;
  const list = unseen
    .slice(0, 8)
    .map(([p, c]) => (c.exists ? p : `${p} (deleted)`))
    .join("\n");
  const more = count > 8 ? `\n+${count - 8} more` : "";
  if (followNotice) {
    return {
      state: "held",
      text: withKey(`Agent edited ${basename(followNotice.path)}`, key),
      title: `Follow didn't switch to ${followNotice.path} because you were busy. Go to it${key ? ` (${key})` : ""}`,
      tone: "warning",
      count: Math.max(count, 1),
    };
  }
  if (count === 0) return undefined;
  const [path, entry] = unseen[0];
  const text =
    count === 1
      ? `${basename(path)}${entry.exists ? "" : " deleted"}`
      : `${count} changed`;
  return {
    state: "changed",
    text: withKey(text, key),
    title: `Changed on disk:\n${list}${more}\n\nGo to the next changed file${key ? ` (${key})` : ""}`,
    tone: "normal",
    count,
  };
}

// ── problems ───────────────────────────────────────────────────────────────

export function problemsStatus(
  errors: ActiveRun["errors"]
): StatusText & { state: "none" | "errors"; count: number } {
  const count = errors.length;
  if (count === 0) {
    return {
      state: "none",
      text: "No problems",
      title: "No problems",
      tone: "muted",
      count: 0,
    };
  }
  const first = errors[0];
  const at = first.location
    ? `${first.location.source}:${first.location.line}:${first.location.column} `
    : "";
  return {
    state: "errors",
    text: plural(count, "problem"),
    title: `${at}${first.message}\n\nShow the first problem in the code`,
    tone: "error",
    count,
  };
}

// ── cursor ─────────────────────────────────────────────────────────────────

export function cursorText(
  cursor: Pick<Cursor, "line" | "column" | "selected">
) {
  const base = `Ln ${cursor.line}, Col ${cursor.column}`;
  return cursor.selected > 0 ? `${base} (${cursor.selected} selected)` : base;
}

// ── run ────────────────────────────────────────────────────────────────────

export function errorKindLabel(kind: string | undefined): string {
  switch (kind) {
    case "runtime":
      return "Runtime error";
    case "compile":
    case "parse":
    case "import":
      return "Compile error";
    default:
      return "Error";
  }
}

export type RunState = "running" | "ok" | "error" | "not-run";

export function runStatus(
  run: Pick<ActiveRun, "status" | "ms" | "errors">,
  runKey: string | undefined // ⌘↵
): StatusText & { state: RunState; ms?: number } {
  switch (run.status) {
    case "running":
      return {
        state: "running",
        text: "Running…",
        title: "Running the model",
        tone: "normal",
      };
    case "ok": {
      const ms = Math.round(run.ms ?? 0);
      return {
        state: "ok",
        text: `Ran in ${ms} ms`,
        title: `Run again${runKey ? ` (${runKey})` : ""}`,
        tone: "normal",
        ms,
      };
    }
    case "error": {
      const first = run.errors[0];
      return {
        state: "error",
        text: errorKindLabel(first?.kind),
        title: first?.message ?? "The model failed",
        tone: "error",
      };
    }
    case "not-run":
      return {
        state: "not-run",
        text: withKey("Not run", runKey),
        title: `Auto-run is off. Run the model${runKey ? ` (${runKey})` : ""}`,
        tone: "warning",
      };
  }
}

// The polite live region's text: only the transitions into an error and back
// to ok are announced (undefined: keep the previous announcement).
export function runAnnouncement(
  previous: RunState | undefined,
  next: StatusText & { state: RunState }
): string | undefined {
  if (next.state === "error" && previous !== "error") {
    return `${next.text}: ${next.title}`;
  }
  if (next.state === "ok" && previous === "error")
    return "The model runs again";
  return undefined;
}

// ── save ───────────────────────────────────────────────────────────────────

export function saveStatus(
  state: SaveState,
  opts: {
    autoSave: StudioSettings["files.autoSave"];
    otherDirty: number; // other working-set files with unsaved edits
    saveKey: string | undefined; // ⌘S
    // Why saves are blocked: another window switched folders (default), or
    // the folder was moved or deleted.
    blockedBy?: "root-changed" | "root-missing";
  }
): StatusText & { state: SaveState } {
  const others = opts.otherDirty > 0 ? ` · ${opts.otherDirty} unsaved` : "";
  const othersTitle =
    opts.otherDirty > 0
      ? `\n${plural(opts.otherDirty, "other file")} with unsaved edits`
      : "";
  const save = opts.saveKey ? ` (${opts.saveKey})` : "";
  switch (state) {
    case "saving":
      return {
        state,
        text: `Saving…${others}`,
        title: `Saving to disk${othersTitle}`,
        tone: "normal",
      };
    case "saved":
      return {
        state,
        text: `Saved${others}`,
        title: `Saved to disk${othersTitle}`,
        tone: "normal",
      };
    case "dirty":
      // With autosave on, a dirty file is saved about a second after the
      // last edit, so the key hint only shows when autosave is off.
      return {
        state,
        text: `${opts.autoSave === "off" ? withKey("Unsaved", opts.saveKey) : "Unsaved"}${others}`,
        title: `Save${save}${othersTitle}`,
        tone: opts.autoSave === "off" ? "warning" : "normal",
      };
    case "conflict":
      return {
        state,
        text: `Not saved: changed on disk${others}`,
        title: `The file changed on disk while you had unsaved edits. Choose in the banner above${othersTitle}`,
        tone: "error",
      };
    case "deleted":
      return {
        state,
        text: `Deleted on disk${others}`,
        title: `The file was deleted on disk. Choose in the banner above${othersTitle}`,
        tone: "error",
      };
    case "blocked":
      return opts.blockedBy === "root-missing"
        ? {
            state,
            text: `Can't save: folder missing${others}`,
            title: `The folder was moved or deleted. Unsaved edits are kept in this window${othersTitle}`,
            tone: "error",
          }
        : {
            state,
            text: `Can't save: folder switched${others}`,
            title: `Another window opened a different folder. Choose in the banner above${othersTitle}`,
            tone: "error",
          };
  }
}

// In these states the save item focuses the banner's first button instead of
// saving.
export const BANNER_SAVE_STATES: ReadonlySet<SaveState> = new Set([
  "conflict",
  "deleted",
  "blocked",
]);
