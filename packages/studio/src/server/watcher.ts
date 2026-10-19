import fs from "node:fs";
import path from "node:path";

import type { StudioEvent } from "../shared/api.js";
import { isIgnoredPath, isVisibleFile } from "./files.js";

const DEBOUNCE_MS = 60;

export type FolderWatcher = { close: () => void };

// Watches `root` recursively and emits debounced file events.
// Uses `fs.watch({ recursive: true })`, which is supported natively on macOS,
// Windows and (since Node 20) Linux, so no extra dependency is needed.
export function watchFolder(
  root: string,
  onEvent: (event: StudioEvent) => void
): FolderWatcher {
  const pending = new Map<string, NodeJS.Timeout>();
  let treeTimer: NodeJS.Timeout | undefined;

  const scheduleTree = () => {
    if (treeTimer) clearTimeout(treeTimer);
    treeTimer = setTimeout(() => onEvent({ type: "tree-changed" }), 150);
  };

  const watcher = fs.watch(root, { recursive: true }, (eventType, filename) => {
    if (!filename) {
      scheduleTree();
      return;
    }
    const apiPath = filename.toString().split(path.sep).join("/");
    if (isIgnoredPath(apiPath)) return;

    if (!isVisibleFile(apiPath)) {
      // Could be a directory rename/creation; refresh the tree.
      if (eventType === "rename") scheduleTree();
      return;
    }

    const existing = pending.get(apiPath);
    if (existing) clearTimeout(existing);
    pending.set(
      apiPath,
      setTimeout(() => {
        pending.delete(apiPath);
        const exists = fs.existsSync(path.join(root, apiPath));
        onEvent({ type: "file-changed", path: apiPath, exists });
        if (eventType === "rename" || !exists) scheduleTree();
      }, DEBOUNCE_MS)
    );
  });

  watcher.on("error", () => {
    // The root may have been deleted; nothing useful to do here.
  });

  return {
    close() {
      watcher.close();
      for (const t of pending.values()) clearTimeout(t);
      if (treeTimer) clearTimeout(treeTimer);
    },
  };
}
