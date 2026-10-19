// The workspace contract (§10.4). `Workspace` is implemented by useWorkspace
// (WP4); App provides it through WorkspaceContext, and every shell component
// reads it with useWorkspaceContext().

import { createContext, useContext } from "react";

import type { RecentFolder, RootInfo, TreeNode } from "../../shared/api.js";

export type OpenFile = {
  path: string;
  status: "loading" | "ready" | "error";
  error?: string;
  buffer: string; // current editor contents
  disk: string; // last known contents on disk
  diskHash: string; // the server's hash of `disk` ("" if unknown)
  // The file changed on disk while the buffer had unsaved edits.
  conflict?: { disk: string; hash: string };
  deletedOnDisk: boolean;
  editorEpoch: number; // hard replacement only (initial load, Reload from disk)
  externalRevision: number; // a clean buffer took new disk content (apply in place)
  runEpoch: number; // an import's content changed (replace the SqProject)
};

export type ChangeEntry = { at: number; exists: boolean; seen: boolean };

export type SaveState =
  | "saved"
  | "saving"
  | "dirty"
  | "conflict"
  | "deleted"
  | "blocked";

export type OpenReason =
  | "tree-arrow"
  | "tree"
  | "quick-open"
  | "switcher"
  | "follow"
  | "history"
  | "link"
  | "start"
  | "url"
  | "api";

export interface Workspace {
  rootInfo?: RootInfo; // { root, name, allowOpenFolder }
  tree: TreeNode[];
  treeLoaded: boolean;
  treeSkipped: string[];
  recentFolders: RecentFolder[]; // GET /api/recent; [] without allowOpenFolder
  files: Record<string, OpenFile>; // the working set (§2.3)
  activePath: string | null;
  mru: string[]; // most recent first, ≤ 20
  externalChanges: Record<string, ChangeEntry>;
  followNotice?: { path: string; at: number }; // Follow held back a switch (§2.8)
  connection: "live" | "reconnecting" | "resyncing";
  rootChangedTo?: string;
  rootMissing: boolean;
  viewIds: Record<string, string>;
  selectView(path: string, viewId: string): void;
  history: {
    canGoBack: boolean;
    canGoForward: boolean;
    back(): void;
    forward(): void;
  };
  openFile(
    path: string,
    opts?: { reason?: OpenReason; view?: string; focus?: "keep" | "main" }
  ): void;
  closeFile(path: string): Promise<void>;
  setBuffer(path: string, code: string): void;
  saveFile(path: string): Promise<void>;
  saveAll(): Promise<void>;
  flushAll(): Promise<void>;
  saveState(path: string): SaveState;
  reloadFromDisk(path: string): Promise<void>;
  overwriteWithMine(path: string): Promise<void>;
  createFile(path: string, content?: string): Promise<string>; // resolves to the canonical path
  renameFile(from: string, to: string): Promise<string>;
  importFromHub(
    id: string,
    opts?: { path?: string; overwrite?: boolean; signal?: AbortSignal }
  ): Promise<string>;
  openFolder(path: string): Promise<void>;
  followRootChange(): Promise<void>;
  refreshTree(): Promise<void>;
  resync(): Promise<void>;
  recordDependency(file: string, dep: string): void;
  markSeen(path: string): void;
  clearChanges(): void;
  clearRecent(): void;
  nextChange(dir: 1 | -1): void;
  setFollowChanges(on: boolean): void;
}

export function treeFilePaths(nodes: TreeNode[]): string[] {
  return nodes.flatMap((n) =>
    n.type === "file" ? [n.path] : treeFilePaths(n.children)
  );
}

// Unsaved: the buffer differs from disk, or a conflict is pending (so undoing
// back to the old text doesn't read as "Saved", #9).
export const isDirty = (file: OpenFile): boolean =>
  file.status === "ready" &&
  (file.buffer !== file.disk || file.conflict !== undefined);

export const WorkspaceContext = createContext<Workspace | null>(null);

export function useWorkspaceContext(): Workspace {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) {
    throw new Error("useWorkspaceContext must be used inside WorkspaceContext");
  }
  return workspace;
}
