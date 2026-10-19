import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

import type { StudioEvent } from "../shared/api.js";
import { hashFile, isIgnoredPath, isVisibleFile, scanTree } from "./files.js";

// Per-file debounce: a file created and removed within it never shows up
// (editors' and agents' temp files, #20).
export const DEBOUNCE_MS = 60;
// Debounce of folder-level rescans (and the tree-changed event they send).
const RESCAN_MS = 150;
// How often a missing root is checked for coming back.
const ROOT_POLL_MS = 1000;

// fs.statSync without throwing (ENOENT, EACCES, …): events arrive in a
// callback where an exception would take the process down.
function statSafe(p: string): fs.Stats | undefined {
  try {
    return fs.statSync(p, { throwIfNoEntry: false });
  } catch {
    return undefined;
  }
}

const logError = (e: unknown) => {
  console.error("Studio's folder watcher failed:", e);
};

export type FolderWatcher = {
  close: () => void;
  // Checks that the root still exists, and broadcasts root-missing once if
  // it doesn't (file routes call this when they answer 410).
  checkRoot: () => void;
  // Resolves once the initial scan has finished (tests).
  ready: Promise<void>;
};

// Watches `root` recursively and emits debounced events, each carrying
// `root` (#13):
// - file-changed {path, exists, hash} for visible files (hash absent for
//   deletions and files over 5 MB). Content-identical rewrites and `touch`
//   carry the same hash, so clients can ignore them (#11).
// - tree-changed when files appear or disappear.
// - root-missing when the root folder is moved or deleted (#35), and
//   root-changed {root} once it is back.
// The watcher keeps the set of visible files: on a folder-level event (`mv
// lib lib-old` is a single event for the folder on macOS) it rescans and
// emits file-changed for every file that vanished or appeared (#12).
// Uses `fs.watch({ recursive: true })`, which is supported natively on macOS,
// Windows and (since Node 20) Linux, so no extra dependency is needed.
export function watchFolder(
  root: string,
  onEvent: (event: StudioEvent) => void
): FolderWatcher {
  const pending = new Map<string, NodeJS.Timeout>();
  let rescanTimer: NodeJS.Timeout | undefined;
  let rootTimer: NodeJS.Timeout | undefined;
  let watcher: fs.FSWatcher | undefined;
  let closed = false;
  let rootMissing = false;
  // Visible files and folders as of the latest scan or event. Until the
  // first scan has finished (and after a truncated one), every deletion is
  // reported, since a file missing from `known` may simply not be scanned.
  let known = new Set<string>();
  let knownDirs = new Set<string>();
  let complete = false;
  let scanning: Promise<void> | undefined;
  let rescanAgain = false;

  const emit = (event: StudioEvent) => {
    if (!closed) onEvent(event);
  };

  const emitFile = async (apiPath: string, exists: boolean) => {
    if (!exists) {
      emit({ type: "file-changed", root, path: apiPath, exists: false });
      return;
    }
    const hash = await hashFile(path.join(root, apiPath));
    if (hash === undefined) {
      // Gone again (or unreadable) by the time we looked.
      emit({ type: "file-changed", root, path: apiPath, exists: false });
      return;
    }
    emit({
      type: "file-changed",
      root,
      path: apiPath,
      exists: true,
      ...(hash ? { hash } : {}),
    });
  };

  const scan = async (diff: boolean) => {
    let result;
    try {
      result = await scanTree(root);
    } catch {
      checkRoot();
      return;
    }
    if (closed) return;
    const next = new Set(result.files);
    if (diff && complete && !result.truncated) {
      for (const p of known) {
        if (!next.has(p)) await emitFile(p, false);
      }
      for (const p of next) {
        if (!known.has(p)) await emitFile(p, true);
      }
    }
    known = next;
    knownDirs = new Set(result.dirs);
    complete = !result.truncated;
    if (diff) emit({ type: "tree-changed", root });
  };

  const runRescan = () => {
    if (scanning) {
      rescanAgain = true;
      return;
    }
    scanning = scan(true)
      .catch(logError)
      .finally(() => {
        scanning = undefined;
        if (rescanAgain && !closed) {
          rescanAgain = false;
          runRescan();
        }
      });
  };

  const scheduleRescan = () => {
    if (rescanTimer) clearTimeout(rescanTimer);
    rescanTimer = setTimeout(() => {
      rescanTimer = undefined;
      runRescan();
    }, RESCAN_MS);
  };

  const fileTimer = (apiPath: string) => async () => {
    pending.delete(apiPath);
    if (closed) return;
    const stat = await fsp
      .stat(path.join(root, apiPath))
      .catch(() => undefined);
    const exists = stat?.isFile() ?? false;
    const wasKnown = known.has(apiPath);
    if (exists) known.add(apiPath);
    else known.delete(apiPath);
    if (!exists && !wasKnown && complete) return; // a temp file
    await emitFile(apiPath, exists);
    if (exists !== wasKnown) scheduleRescan(); // the tree changed
  };

  const onFsEvent = (filename: string | null) => {
    // While the root is missing, its files' events are noise; pollRoot
    // rescans once it is back.
    if (closed || rootMissing) return;
    if (!filename) {
      checkRoot();
      scheduleRescan();
      return;
    }
    const apiPath = filename.split(path.sep).join("/");
    if (isIgnoredPath(apiPath)) return;

    if (isVisibleFile(apiPath)) {
      const existing = pending.get(apiPath);
      if (existing) clearTimeout(existing);
      const run = fileTimer(apiPath);
      pending.set(
        apiPath,
        setTimeout(() => void run().catch(logError), DEBOUNCE_MS)
      );
      return;
    }
    // A folder (created, renamed, deleted), the root itself (macOS reports
    // the root's own rename or deletion under its basename), or a file
    // Studio doesn't show (temp files of atomic writes, .txt, …).
    checkRoot();
    if (rootMissing) return;
    if (knownDirs.has(apiPath)) {
      scheduleRescan();
      return;
    }
    if (statSafe(path.join(root, apiPath))?.isDirectory()) scheduleRescan();
  };

  const startFsWatcher = () => {
    watcher?.close();
    try {
      watcher = fs.watch(root, { recursive: true }, (_type, filename) =>
        onFsEvent(filename)
      );
    } catch {
      watcher = undefined;
      checkRoot();
      return;
    }
    watcher.on("error", () => {
      // The root may have been deleted (Linux), or the watch failed.
      watcher?.close();
      watcher = undefined;
      checkRoot();
      if (!rootMissing && !closed) startFsWatcher();
    });
  };

  const pollRoot = () => {
    rootTimer = setTimeout(() => {
      rootTimer = undefined;
      if (closed) return;
      if (!statSafe(root)?.isDirectory()) {
        pollRoot();
        return;
      }
      rootMissing = false;
      startFsWatcher();
      void scan(true)
        .then(() => emit({ type: "root-changed", root }))
        .catch(logError);
    }, ROOT_POLL_MS);
  };

  function checkRoot() {
    if (closed || rootMissing) return;
    if (statSafe(root)?.isDirectory()) return;
    rootMissing = true;
    for (const t of pending.values()) clearTimeout(t);
    pending.clear();
    emit({ type: "root-missing", root });
    pollRoot();
  }

  startFsWatcher();
  const ready = scan(false).catch(logError);

  return {
    ready,
    checkRoot,
    close() {
      closed = true;
      watcher?.close();
      for (const t of pending.values()) clearTimeout(t);
      pending.clear();
      if (rescanTimer) clearTimeout(rescanTimer);
      if (rootTimer) clearTimeout(rootTimer);
    },
  };
}
