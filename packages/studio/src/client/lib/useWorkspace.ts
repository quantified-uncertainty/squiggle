import { useCallback, useEffect, useRef, useState } from "react";

import type {
  RecentFolder,
  RootInfo,
  StudioEvent,
  TreeNode,
} from "../../shared/api.js";
import { API_ERROR_CODES } from "../../shared/api.js";
import { api, ApiError, setExpectedRoot } from "./api.js";
import {
  loadFolderState,
  loadFollowChanges,
  saveFolderState,
  saveFollowChanges,
} from "./storage.js";
import { useStudioEvents } from "./useStudioEvents.js";

export type OpenFile = {
  path: string;
  status: "loading" | "ready" | "error";
  error?: string;
  buffer: string; // current editor contents
  disk: string; // last known contents on disk
  // Set when the file changed on disk while the buffer had unsaved edits.
  conflict?: { disk: string };
  deletedOnDisk: boolean;
  // Bumped when the buffer is replaced from outside; editors remount on change.
  editorEpoch: number;
  // Bumped when a dependency (imported file) changes; runs restart on change.
  runEpoch: number;
};

function treeFilePaths(nodes: TreeNode[]): string[] {
  return nodes.flatMap((n) =>
    n.type === "file" ? [n.path] : treeFilePaths(n.children)
  );
}

export const isDirty = (file: OpenFile) =>
  file.status === "ready" && file.buffer !== file.disk;

const MAX_RECENT_FILES = 12;

// File-change events for a path within this long after our own save of it are
// treated as echoes of that save, not as external changes.
const OWN_SAVE_ECHO_MS = 2000;

export function useWorkspace(options: {
  onError: (message: string) => void;
  initialFile?: string;
}) {
  const { onError } = options;
  const [rootInfo, setRootInfo] = useState<RootInfo | undefined>();
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [recentFolders, setRecentFolders] = useState<RecentFolder[]>([]);
  const [recentFiles, setRecentFiles] = useState<string[]>([]);
  const [files, setFiles] = useState<Record<string, OpenFile>>({});
  const [order, setOrder] = useState<string[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  // When each file last changed on disk from outside Studio (e.g. edited by a
  // coding agent), in ms since epoch.
  const [externalChanges, setExternalChanges] = useState<
    Record<string, number>
  >({});
  // Open files automatically when they change on disk.
  const [followChanges, setFollowChangesState] = useState(loadFollowChanges);
  const followChangesRef = useRef(followChanges);
  followChangesRef.current = followChanges;
  const ownSavesRef = useRef(new Map<string, number>());

  // Imported files per open file, filled by the linker.
  const depsRef = useRef(new Map<string, Set<string>>());
  const filesRef = useRef(files);
  filesRef.current = files;
  const rootRef = useRef<string | undefined>(undefined);
  const openingFolderRef = useRef(false);
  // `?file=` only applies to the folder Studio was opened with.
  const initialFileRef = useRef(options.initialFile);
  // Set when another window/tab switched the server to a different folder while
  // this one had unsaved edits; those edits can't be saved anymore.
  const [rootChangedTo, setRootChangedTo] = useState<string | undefined>();
  const orderRef = useRef(order);
  orderRef.current = order;

  const updateFile = useCallback(
    (path: string, fn: (file: OpenFile) => OpenFile) => {
      setFiles((prev) =>
        prev[path] ? { ...prev, [path]: fn(prev[path]) } : prev
      );
    },
    []
  );

  const refreshTree = useCallback(async () => {
    const { tree } = await api.getTree();
    setTree(tree);
    return tree;
  }, []);

  const refreshRecentFolders = useCallback(async () => {
    setRecentFolders(await api.getRecentFolders());
  }, []);

  const loadFile = useCallback(async (path: string) => {
    try {
      const { content } = await api.readFile(path);
      setFiles((prev) => ({
        ...prev,
        [path]: {
          ...prev[path],
          status: "ready",
          error: undefined,
          buffer: content,
          disk: content,
          conflict: undefined,
          deletedOnDisk: false,
          editorEpoch: (prev[path]?.editorEpoch ?? 0) + 1,
        },
      }));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setFiles((prev) => ({
        ...prev,
        [path]: { ...prev[path], status: "error", error: message },
      }));
    }
  }, []);

  const openFile = useCallback(
    (path: string) => {
      setActivePath(path);
      setOrder((prev) => (prev.includes(path) ? prev : [...prev, path]));
      setRecentFiles((prev) =>
        [path, ...prev.filter((p) => p !== path)].slice(0, MAX_RECENT_FILES)
      );
      if (!filesRef.current[path]) {
        setFiles((prev) => ({
          ...prev,
          [path]: {
            path,
            status: "loading",
            buffer: "",
            disk: "",
            deletedOnDisk: false,
            editorEpoch: 0,
            runEpoch: 0,
          },
        }));
        void loadFile(path);
      }
    },
    [loadFile]
  );

  const closeFile = useCallback((path: string) => {
    const file = filesRef.current[path];
    if (
      file &&
      isDirty(file) &&
      !window.confirm(`${path} has unsaved changes. Close anyway?`)
    ) {
      return;
    }
    const prev = orderRef.current;
    const next = prev.filter((p) => p !== path);
    setOrder(next);
    setActivePath((active) => {
      if (active !== path) return active;
      const i = prev.indexOf(path);
      return next[Math.min(i, next.length - 1)] ?? null;
    });
    setFiles((prev) => {
      const next = { ...prev };
      delete next[path];
      return next;
    });
    depsRef.current.delete(path);
  }, []);

  const setBuffer = useCallback(
    (path: string, buffer: string) =>
      updateFile(path, (f) => ({ ...f, buffer })),
    [updateFile]
  );

  const saveFile = useCallback(
    async (path: string) => {
      const file = filesRef.current[path];
      if (!file || file.status !== "ready") return;
      const content = file.buffer;
      ownSavesRef.current.set(path, Date.now());
      try {
        await api.writeFile(path, content);
      } catch (e) {
        if (e instanceof ApiError && e.code === API_ERROR_CODES.rootChanged) {
          setRootChangedTo(e.root ?? "another folder");
          throw new Error(
            `Not saved: Studio was switched to ${e.root ?? "another folder"} in another window.`
          );
        }
        throw e;
      }
      updateFile(path, (f) => ({
        ...f,
        disk: content,
        conflict: undefined,
        deletedOnDisk: false,
      }));
    },
    [updateFile]
  );

  // Conflict resolution.
  const reloadFromDisk = useCallback(
    (path: string) => {
      updateFile(path, (f) =>
        f.conflict
          ? {
              ...f,
              buffer: f.conflict.disk,
              disk: f.conflict.disk,
              conflict: undefined,
              editorEpoch: f.editorEpoch + 1,
            }
          : f
      );
    },
    [updateFile]
  );
  const keepMine = useCallback(
    (path: string) => {
      updateFile(path, (f) =>
        f.conflict ? { ...f, disk: f.conflict.disk, conflict: undefined } : f
      );
    },
    [updateFile]
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
        setExternalChanges((prev) => ({ ...prev, [path]: Date.now() }));
        if (
          exists &&
          followChangesRef.current &&
          !filesRef.current[path] &&
          path.endsWith(".squiggle")
        ) {
          // Follow mode: open the file the agent is working on. Already-open
          // files are reloaded below.
          openFile(path);
          return;
        }
        if (exists && followChangesRef.current && filesRef.current[path]) {
          setActivePath(path);
        }
      }

      const file = filesRef.current[path];
      if (!file || file.status === "loading") return;
      if (!exists) {
        updateFile(path, (f) => ({ ...f, deletedOnDisk: true }));
        return;
      }
      let content: string;
      try {
        content = (await api.readFile(path)).content;
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
            conflict: undefined,
            deletedOnDisk: false,
            editorEpoch:
              f.buffer === content ? f.editorEpoch : f.editorEpoch + 1,
          };
        }
        return { ...f, conflict: { disk: content }, deletedOnDisk: false };
      });
    },
    [updateFile, openFile]
  );

  const setFollowChanges = useCallback((follow: boolean) => {
    setFollowChangesState(follow);
    saveFollowChanges(follow);
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
      const [tree] = await Promise.all([refreshTree(), refreshRecentFolders()]);
      // Don't restore tabs or recent entries for files deleted since.
      const existing = new Set(treeFilePaths(tree));
      const state = {
        ...saved,
        openFiles: saved.openFiles.filter((p) => existing.has(p)),
        recentFiles: saved.recentFiles.filter((p) => existing.has(p)),
      };
      setFiles({});
      setOrder([]);
      setActivePath(null);
      setExternalChanges({});
      filesRef.current = {};
      orderRef.current = [];
      setRecentFiles(state.recentFiles);
      const toOpen = state.openFiles;
      setRootChangedTo(undefined);
      for (const p of toOpen) openFile(p);
      const initialFile = initialFileRef.current;
      initialFileRef.current = undefined;
      if (initialFile) openFile(initialFile);
      else if (state.activeFile && toOpen.includes(state.activeFile)) {
        setActivePath(state.activeFile);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openFile, refreshRecentFolders, refreshTree]
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

  // Persist open files per folder.
  useEffect(() => {
    if (!rootInfo) return;
    saveFolderState(rootInfo.root, {
      openFiles: order,
      activeFile: activePath,
      recentFiles,
    });
  }, [rootInfo, order, activePath, recentFiles]);

  const connected = useStudioEvents((event: StudioEvent) => {
    switch (event.type) {
      case "file-changed":
        handleFileChanged(event.path, event.exists).catch((e: unknown) =>
          onError(e instanceof Error ? e.message : String(e))
        );
        break;
      case "tree-changed":
        void refreshTree();
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
    }
  });

  const dirtyCount = () =>
    Object.values(filesRef.current).filter(isDirty).length;

  const openFolder = useCallback(
    async (folder: string) => {
      const dirty = dirtyCount();
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

  const createFile = useCallback(
    async (path: string, content: string) => {
      ownSavesRef.current.set(path, Date.now());
      await api.createFile(path, content);
      await refreshTree();
      openFile(path);
    },
    [refreshTree, openFile]
  );

  // Renames on disk and carries over open buffers (including unsaved edits),
  // tabs, recent files and the active file.
  const renameFile = useCallback(
    async (from: string, to: string) => {
      const now = Date.now();
      ownSavesRef.current.set(from, now);
      ownSavesRef.current.set(to, now);
      await api.renameFile(from, to);
      const move = (p: string) => (p === from ? to : p);
      setFiles((prev) => {
        if (!prev[from]) return prev;
        const next = { ...prev, [to]: { ...prev[from], path: to } };
        delete next[from];
        filesRef.current = next;
        return next;
      });
      setOrder((prev) => prev.map(move));
      setRecentFiles((prev) => prev.map(move));
      setActivePath((prev) => (prev === null ? prev : move(prev)));
      const deps = depsRef.current.get(from);
      if (deps) {
        depsRef.current.delete(from);
        depsRef.current.set(to, deps);
      }
      await refreshTree();
    },
    [refreshTree]
  );

  // Accepts the folder switch made elsewhere, discarding unsaved edits.
  const followRootChange = useCallback(async () => {
    await resetForRoot(await api.getRoot());
  }, [resetForRoot]);

  return {
    rootInfo,
    tree,
    recentFolders,
    recentFiles,
    files,
    order,
    activePath,
    setActivePath,
    openFile,
    closeFile,
    setBuffer,
    saveFile,
    reloadFromDisk,
    keepMine,
    recordDependency,
    refreshTree,
    openFolder,
    connected,
    externalChanges,
    followChanges,
    setFollowChanges,
    rootChangedTo,
    followRootChange,
    createFile,
    renameFile,
  };
}

export type Workspace = ReturnType<typeof useWorkspace>;
