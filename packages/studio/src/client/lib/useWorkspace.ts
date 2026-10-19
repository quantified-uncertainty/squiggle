import { useCallback, useEffect, useRef, useState } from "react";

import type {
  RecentFolder,
  RootInfo,
  StudioEvent,
  TreeNode,
} from "../../shared/api.js";
import { api, ApiError } from "./api.js";
import { loadFolderState, saveFolderState } from "./storage.js";
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

export const isDirty = (file: OpenFile) =>
  file.status === "ready" && file.buffer !== file.disk;

const MAX_RECENT_FILES = 12;

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

  // Imported files per open file, filled by the linker.
  const depsRef = useRef(new Map<string, Set<string>>());
  const filesRef = useRef(files);
  filesRef.current = files;
  const rootRef = useRef<string | undefined>(undefined);
  const openingFolderRef = useRef(false);
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
      await api.writeFile(path, content);
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
    [updateFile]
  );

  const resetForRoot = useCallback(
    async (info: RootInfo) => {
      setRootInfo(info);
      rootRef.current = info.root;
      depsRef.current.clear();
      const state = loadFolderState(info.root);
      await Promise.all([refreshTree(), refreshRecentFolders()]);
      setFiles({});
      setOrder([]);
      setActivePath(null);
      filesRef.current = {};
      orderRef.current = [];
      setRecentFiles(state.recentFiles);
      const toOpen = state.openFiles;
      for (const p of toOpen) openFile(p);
      if (options.initialFile) openFile(options.initialFile);
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

  useStudioEvents((event: StudioEvent) => {
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
        if (!openingFolderRef.current && event.root !== rootRef.current) {
          void api.getRoot().then(resetForRoot);
        }
        break;
    }
  });

  const openFolder = useCallback(
    async (folder: string) => {
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
  };
}

export type Workspace = ReturnType<typeof useWorkspace>;
