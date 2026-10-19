// The workspace model. WP0 adapted the HEAD implementation to the `Workspace`
// interface (workspaceTypes.ts); members that arrive with WP4 (history,
// autosave, hash-based sync, resync, Follow's gates, …) are simple or no-op
// here. Owner: WP4.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  RecentFolder,
  RootInfo,
  StudioEvent,
  TreeNode,
} from "../../shared/api.js";
import { API_ERROR_CODES, parseHubImport } from "../../shared/api.js";
import { api, ApiError, setExpectedRoot } from "./api.js";
import { reportBusy, useReportBusy } from "./idle.js";
import { clearViewState, recordNavigation } from "./navigation.js";
import {
  loadFolderState,
  loadViewIds,
  saveFolderState,
  saveViewIds,
} from "./storage.js";
import { updateSettings, useSetting } from "./studioState.js";
import { useStudioEvents } from "./useStudioEvents.js";
import {
  type ChangeEntry,
  isDirty,
  type OpenFile,
  type OpenReason,
  type SaveState,
  treeFilePaths,
  type Workspace,
} from "./workspaceTypes.js";

export { isDirty, type OpenFile, type Workspace } from "./workspaceTypes.js";

const MAX_RECENT_FILES = 20;

// File-change events for a path within this long after our own save of it are
// treated as echoes of that save, not as external changes. (WP4 replaces this
// with hash-based echo detection, #34.)
const OWN_SAVE_ECHO_MS = 2000;

const emptyFile = (path: string): OpenFile => ({
  path,
  status: "loading",
  buffer: "",
  disk: "",
  diskHash: "",
  deletedOnDisk: false,
  editorEpoch: 0,
  externalRevision: 0,
  runEpoch: 0,
});

export function useWorkspace(options: {
  onError: (message: string) => void;
  initialFile?: string;
}): Workspace {
  const { onError } = options;
  const [rootInfo, setRootInfo] = useState<RootInfo | undefined>();
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [treeLoaded, setTreeLoaded] = useState(false);
  const [treeSkipped, setTreeSkipped] = useState<string[]>([]);
  const [recentFolders, setRecentFolders] = useState<RecentFolder[]>([]);
  const [mru, setMru] = useState<string[]>([]);
  const [files, setFiles] = useState<Record<string, OpenFile>>({});
  const [activePath, setActivePath] = useState<string | null>(null);
  const [externalChanges, setExternalChanges] = useState<
    Record<string, ChangeEntry>
  >({});
  const [viewIds, setViewIds] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, true>>({});
  // Not idle before the first tree has loaded (§6.5).
  useReportBusy("workspace:boot", !treeLoaded);
  const followChanges = useSetting("squiggle.followChanges");
  const followChangesRef = useRef(followChanges);
  followChangesRef.current = followChanges;
  const ownSavesRef = useRef(new Map<string, number>());

  // Imported files per open file, filled by the linker.
  const depsRef = useRef(new Map<string, Set<string>>());
  const filesRef = useRef(files);
  filesRef.current = files;
  const viewIdsRef = useRef(viewIds);
  viewIdsRef.current = viewIds;
  const rootRef = useRef<string | undefined>(undefined);
  const openingFolderRef = useRef(false);
  // `?file=` only applies to the folder Studio was opened with.
  const initialFileRef = useRef(options.initialFile);
  // Set when another window/tab switched the server to a different folder while
  // this one had unsaved edits; those edits can't be saved anymore.
  const [rootChangedTo, setRootChangedTo] = useState<string | undefined>();

  const updateFile = useCallback(
    (path: string, fn: (file: OpenFile) => OpenFile) => {
      setFiles((prev) =>
        prev[path] ? { ...prev, [path]: fn(prev[path]) } : prev
      );
    },
    []
  );

  const refreshTreeNodes = useCallback(async () => {
    reportBusy("tree", true);
    try {
      const response = await api.getTree();
      setTree(response.tree);
      setTreeSkipped(response.skipped);
      setTreeLoaded(true);
      return response.tree;
    } finally {
      reportBusy("tree", false);
    }
  }, []);

  const refreshRecentFolders = useCallback(async () => {
    setRecentFolders(await api.getRecentFolders());
  }, []);

  const loadFile = useCallback(async (path: string) => {
    reportBusy(`load:${path}`, true);
    try {
      const { content, hash } = await api.readFile(path);
      setFiles((prev) => ({
        ...prev,
        [path]: {
          ...(prev[path] ?? emptyFile(path)),
          status: "ready",
          error: undefined,
          buffer: content,
          disk: content,
          diskHash: hash,
          conflict: undefined,
          deletedOnDisk: false,
          editorEpoch: (prev[path]?.editorEpoch ?? 0) + 1,
        },
      }));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setFiles((prev) => ({
        ...prev,
        [path]: {
          ...(prev[path] ?? emptyFile(path)),
          status: "error",
          error: message,
        },
      }));
    } finally {
      reportBusy(`load:${path}`, false);
    }
  }, []);

  const openFile = useCallback(
    (
      path: string,
      opts: { reason?: OpenReason; view?: string; focus?: "keep" | "main" } = {}
    ) => {
      setActivePath(path);
      setMru((prev) =>
        [path, ...prev.filter((p) => p !== path)].slice(0, MAX_RECENT_FILES)
      );
      if (opts.view) {
        setViewIds((prev) => ({ ...prev, [path]: opts.view as string }));
      }
      recordNavigation(
        { file: path, view: opts.view ?? viewIdsRef.current[path] },
        opts.reason ?? "api"
      );
      if (!filesRef.current[path]) {
        setFiles((prev) => ({ ...prev, [path]: emptyFile(path) }));
        void loadFile(path);
      }
    },
    [loadFile]
  );

  const mruRef = useRef(mru);
  mruRef.current = mru;

  // Removes the file from the working set and MRU, then shows the next MRU
  // file, or the start page.
  const closeFile = useCallback(
    async (path: string) => {
      const file = filesRef.current[path];
      if (
        file &&
        isDirty(file) &&
        !window.confirm(`${path} has unsaved changes. Close anyway?`)
      ) {
        return;
      }
      setFiles((prev) => {
        const next = { ...prev };
        delete next[path];
        return next;
      });
      depsRef.current.delete(path);
      const rest = mruRef.current.filter((p) => p !== path);
      setMru(rest);
      if (rest[0]) openFile(rest[0], { reason: "api" });
      else {
        setActivePath((active) => (active === path ? null : active));
        // The start page has no view parameters in the address bar.
        clearViewState();
      }
    },
    [openFile]
  );

  const setBuffer = useCallback(
    (path: string, buffer: string) =>
      updateFile(path, (f) => ({ ...f, buffer })),
    [updateFile]
  );

  const write = useCallback(async (path: string, content: string) => {
    ownSavesRef.current.set(path, Date.now());
    setSaving((prev) => ({ ...prev, [path]: true }));
    reportBusy(`save:${path}`, true);
    try {
      return await api.writeFile(path, content);
    } catch (e) {
      if (e instanceof ApiError && e.code === API_ERROR_CODES.rootChanged) {
        setRootChangedTo(e.root ?? "another folder");
        throw new Error(
          `Not saved: Studio was switched to ${e.root ?? "another folder"} in another window.`
        );
      }
      throw e;
    } finally {
      reportBusy(`save:${path}`, false);
      setSaving((prev) => {
        const next = { ...prev };
        delete next[path];
        return next;
      });
    }
  }, []);

  const saveFile = useCallback(
    async (path: string) => {
      const file = filesRef.current[path];
      if (!file || file.status !== "ready") return;
      const content = file.buffer;
      const { hash } = await write(path, content);
      updateFile(path, (f) => ({
        ...f,
        disk: content,
        diskHash: hash,
        conflict: undefined,
        deletedOnDisk: false,
      }));
    },
    [updateFile, write]
  );

  const saveAll = useCallback(async () => {
    for (const file of Object.values(filesRef.current)) {
      if (isDirty(file)) await saveFile(file.path);
    }
  }, [saveFile]);

  const saveState = useCallback(
    (path: string): SaveState => {
      const file = files[path];
      if (rootChangedTo) return "blocked";
      if (saving[path]) return "saving";
      if (!file) return "saved";
      if (file.conflict) return "conflict";
      if (file.deletedOnDisk) return "deleted";
      return isDirty(file) ? "dirty" : "saved";
    },
    [files, saving, rootChangedTo]
  );

  // Conflict resolution. Reload re-reads the file (#9).
  const reloadFromDisk = useCallback(
    async (path: string) => {
      await loadFile(path);
    },
    [loadFile]
  );
  const overwriteWithMine = useCallback(
    async (path: string) => {
      updateFile(path, (f) =>
        f.conflict
          ? {
              ...f,
              disk: f.conflict.disk,
              diskHash: f.conflict.hash,
              conflict: undefined,
            }
          : f
      );
      filesRef.current = {
        ...filesRef.current,
        [path]: { ...filesRef.current[path], conflict: undefined },
      };
      await saveFile(path);
    },
    [updateFile, saveFile]
  );

  const recordDependency = useCallback((file: string, dep: string) => {
    const deps = depsRef.current.get(file) ?? new Set<string>();
    deps.add(dep);
    depsRef.current.set(file, deps);
  }, []);

  const handleFileChanged = useCallback(
    async (path: string, exists: boolean) => {
      // Re-run open files that import the changed file.
      for (const [file, deps] of depsRef.current) {
        if (file !== path && deps.has(path)) {
          deps.clear();
          updateFile(file, (f) => ({ ...f, runEpoch: f.runEpoch + 1 }));
        }
      }

      const savedAt = ownSavesRef.current.get(path);
      const isOwnSave =
        savedAt !== undefined && Date.now() - savedAt < OWN_SAVE_ECHO_MS;
      if (!isOwnSave) {
        setExternalChanges((prev) => ({
          ...prev,
          [path]: { at: Date.now(), exists, seen: false },
        }));
        if (exists && followChangesRef.current && path.endsWith(".squiggle")) {
          // Follow mode: show the file the agent is working on.
          openFile(path, { reason: "follow" });
        }
      }

      const file = filesRef.current[path];
      if (!file || file.status === "loading") return;
      if (!exists) {
        updateFile(path, (f) => ({ ...f, deletedOnDisk: true }));
        return;
      }
      let content: string;
      let hash: string;
      try {
        ({ content, hash } = await api.readFile(path));
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) {
          updateFile(path, (f) => ({ ...f, deletedOnDisk: true }));
          return;
        }
        throw e;
      }
      updateFile(path, (f) => {
        if (content === f.disk) {
          // Our own save echoing back, or a no-op touch.
          return { ...f, deletedOnDisk: false };
        }
        if (f.buffer === f.disk || f.buffer === content) {
          // No unsaved edits: just take the new contents.
          return {
            ...f,
            status: "ready",
            buffer: content,
            disk: content,
            diskHash: hash,
            conflict: undefined,
            deletedOnDisk: false,
            externalRevision: f.externalRevision + 1,
            // WP5 applies external changes in place; until then, remount.
            editorEpoch:
              f.buffer === content ? f.editorEpoch : f.editorEpoch + 1,
          };
        }
        return {
          ...f,
          conflict: { disk: content, hash },
          deletedOnDisk: false,
        };
      });
    },
    [updateFile, openFile]
  );

  const setFollowChanges = useCallback((on: boolean) => {
    void updateSettings({ "squiggle.followChanges": on });
  }, []);

  const resetForRoot = useCallback(
    async (info: RootInfo) => {
      setRootInfo(info);
      rootRef.current = info.root;
      // File requests carry the root we think is open; the server rejects
      // them (409 root-changed) if it switched folders in the meantime.
      setExpectedRoot(info.root);
      depsRef.current.clear();
      const saved = loadFolderState(info.root);
      setViewIds(loadViewIds(info.root));
      const [treeResult] = await Promise.allSettled([
        refreshTreeNodes(),
        refreshRecentFolders(),
      ]);
      const nodes = treeResult.status === "fulfilled" ? treeResult.value : [];
      // Don't restore files deleted since.
      const existing = new Set(treeFilePaths(nodes));
      setFiles({});
      setActivePath(null);
      setExternalChanges({});
      filesRef.current = {};
      setMru(saved.recentFiles.filter((p) => existing.has(p)));
      setRootChangedTo(undefined);
      const initialFile = initialFileRef.current;
      initialFileRef.current = undefined;
      if (initialFile) openFile(initialFile, { reason: "url" });
      else if (saved.activeFile && existing.has(saved.activeFile)) {
        openFile(saved.activeFile, { reason: "start" });
      }
    },
    [openFile, refreshRecentFolders, refreshTreeNodes]
  );

  useEffect(() => {
    let cancelled = false;
    api
      .getRoot()
      .then((info) => {
        if (!cancelled) return resetForRoot(info);
      })
      .catch((e: unknown) =>
        onError(e instanceof Error ? e.message : String(e))
      );
    return () => {
      cancelled = true;
    };
  }, [resetForRoot, onError]);

  // Persist the shown file and recent files per folder (WP4 moves this into
  // studioState's root state).
  useEffect(() => {
    if (!rootInfo) return;
    saveFolderState(rootInfo.root, {
      openFiles: activePath ? [activePath] : [],
      activeFile: activePath,
      recentFiles: mru,
    });
  }, [rootInfo, activePath, mru]);

  const connected = useStudioEvents((event: StudioEvent) => {
    switch (event.type) {
      case "file-changed":
        handleFileChanged(event.path, event.exists).catch((e: unknown) =>
          onError(e instanceof Error ? e.message : String(e))
        );
        break;
      case "tree-changed":
        void refreshTreeNodes();
        break;
      case "root-changed":
        // Another window (or Electron shell) switched folders.
        if (openingFolderRef.current || event.root === rootRef.current) break;
        if (Object.values(filesRef.current).some(isDirty)) {
          // Don't throw away unsaved edits; let the user decide (see banner).
          setRootChangedTo(event.root);
        } else {
          void api.getRoot().then(resetForRoot);
        }
        break;
      default:
        break;
    }
  });

  const openFolder = useCallback(
    async (folder: string) => {
      const dirty = Object.values(filesRef.current).filter(isDirty).length;
      if (
        dirty > 0 &&
        !window.confirm(
          `You have unsaved changes in ${dirty} file${dirty === 1 ? "" : "s"}. Discard them and open ${folder}?`
        )
      ) {
        return;
      }
      openingFolderRef.current = true;
      try {
        const info = await api.openFolder(folder);
        await resetForRoot(info);
      } finally {
        openingFolderRef.current = false;
      }
    },
    [resetForRoot]
  );

  const refreshTree = useCallback(async () => {
    await refreshTreeNodes();
  }, [refreshTreeNodes]);

  const createFile = useCallback(
    async (path: string, content = "") => {
      ownSavesRef.current.set(path, Date.now());
      const result = await api.createFile(path, content);
      await refreshTreeNodes();
      openFile(result.path, { reason: "api" });
      return result.path;
    },
    [refreshTreeNodes, openFile]
  );

  // Renames on disk and carries over the buffer (including unsaved edits),
  // the view choice, recent files and the shown file.
  const renameFile = useCallback(
    async (from: string, to: string) => {
      const now = Date.now();
      ownSavesRef.current.set(from, now);
      ownSavesRef.current.set(to, now);
      const result = await api.renameFile(from, to);
      const dest = result.to;
      const move = (p: string) => (p === from ? dest : p);
      setFiles((prev) => {
        if (!prev[from]) return prev;
        const next = { ...prev, [dest]: { ...prev[from], path: dest } };
        delete next[from];
        filesRef.current = next;
        return next;
      });
      setMru((prev) => prev.map(move));
      setActivePath((prev) => (prev === null ? prev : move(prev)));
      setViewIds((prev) => {
        if (!(from in prev)) return prev;
        const next = { ...prev, [dest]: prev[from] };
        delete next[from];
        return next;
      });
      const deps = depsRef.current.get(from);
      if (deps) {
        depsRef.current.delete(from);
        depsRef.current.set(dest, deps);
      }
      await refreshTreeNodes();
      return dest;
    },
    [refreshTreeNodes]
  );

  const importFromHub = useCallback(
    async (
      id: string,
      opts: { path?: string; overwrite?: boolean; signal?: AbortSignal } = {}
    ) => {
      const parsed = parseHubImport(id.startsWith("hub:") ? id : `hub:${id}`);
      if (!parsed)
        throw new Error(`Invalid Hub id "${id}", expected owner/slug`);
      const path = opts.path ?? `hub/${parsed.slug}.squiggle`;
      ownSavesRef.current.set(path, Date.now());
      const result = await api.importFromHubLegacy({
        ...parsed,
        path,
        overwrite: opts.overwrite,
        signal: opts.signal,
      });
      await refreshTreeNodes();
      return result.path;
    },
    [refreshTreeNodes]
  );

  // Accepts the folder switch made elsewhere, discarding unsaved edits.
  const followRootChange = useCallback(async () => {
    await resetForRoot(await api.getRoot());
  }, [resetForRoot]);

  const selectView = useCallback((path: string, viewId: string) => {
    setViewIds((prev) => {
      if (prev[path] === viewId) return prev;
      const next = { ...prev, [path]: viewId };
      if (rootRef.current) saveViewIds(rootRef.current, next);
      return next;
    });
  }, []);

  const markSeen = useCallback((path: string) => {
    setExternalChanges((prev) =>
      prev[path] && !prev[path].seen
        ? { ...prev, [path]: { ...prev[path], seen: true } }
        : prev
    );
  }, []);

  // Viewing a changed file marks its change as seen.
  useEffect(() => {
    if (activePath) markSeen(activePath);
  }, [activePath, markSeen]);

  const clearChanges = useCallback(() => setExternalChanges({}), []);
  const clearRecent = useCallback(() => setMru([]), []);

  const externalChangesRef = useRef(externalChanges);
  externalChangesRef.current = externalChanges;
  const nextChange = useCallback(
    (dir: 1 | -1) => {
      const unseen = Object.entries(externalChangesRef.current)
        .filter(([, c]) => !c.seen && c.exists)
        .sort(([, a], [, b]) => b.at - a.at)
        .map(([p]) => p);
      const target = dir === 1 ? unseen[0] : unseen[unseen.length - 1];
      if (target) openFile(target, { reason: "api" });
    },
    [openFile]
  );

  const history = useMemo(
    () => ({
      canGoBack: false,
      canGoForward: false,
      back: () => window.history.back(),
      forward: () => window.history.forward(),
    }),
    []
  );

  return {
    rootInfo,
    tree,
    treeLoaded,
    treeSkipped,
    recentFolders: rootInfo?.allowOpenFolder === false ? [] : recentFolders,
    files,
    activePath,
    mru,
    externalChanges,
    followNotice: undefined,
    connection: connected ? "live" : "reconnecting",
    rootChangedTo,
    rootMissing: false,
    viewIds,
    selectView,
    history,
    openFile,
    closeFile,
    setBuffer,
    saveFile,
    saveAll,
    flushAll: saveAll,
    saveState,
    reloadFromDisk,
    overwriteWithMine,
    createFile,
    renameFile,
    importFromHub,
    openFolder,
    followRootChange,
    refreshTree,
    resync: refreshTree,
    recordDependency,
    markSeen,
    clearChanges,
    clearRecent,
    nextChange,
    setFollowChanges,
  };
}
