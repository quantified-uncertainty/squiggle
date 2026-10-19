import { FC, PropsWithChildren, useMemo, useState } from "react";

import { GlobeIcon, RefreshIcon, TextTooltip } from "@quri/ui";

import { isDirty, type Workspace } from "../lib/useWorkspace.js";
import { basename } from "../lib/paths.js";
import { FileTree } from "./FileTree.js";
import { HubImportModal } from "./HubImportModal.js";
import { FolderIcon, SquiggleIcon } from "./icons.js";
import { OpenFolderModal } from "./OpenFolderModal.js";

const SectionTitle: FC<PropsWithChildren> = ({ children }) => (
  <div className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
    {children}
  </div>
);

const IconButton: FC<
  PropsWithChildren<{ title: string; onClick: () => void }>
> = ({ title, onClick, children }) => (
  <TextTooltip text={title} placement="bottom">
    <button
      type="button"
      aria-label={title}
      className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
      onClick={onClick}
    >
      {children}
    </button>
  </TextTooltip>
);

export const Sidebar: FC<{ workspace: Workspace }> = ({ workspace }) => {
  const [modal, setModal] = useState<"folder" | "hub" | null>(null);
  const { rootInfo, files } = workspace;

  const dirtyPaths = useMemo(
    () =>
      new Set(
        Object.values(files)
          .filter(isDirty)
          .map((f) => f.path)
      ),
    [files]
  );

  const recentFiles = workspace.recentFiles.filter(
    (p) => p !== workspace.activePath
  );

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-50">
      <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2.5">
        <SquiggleIcon size={18} className="text-orange-500" />
        <span className="text-sm font-semibold text-slate-800">
          Squiggle Studio
        </span>
      </div>
      <div className="flex items-center gap-1 px-2 pt-2">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded px-1 py-1 text-left hover:bg-slate-200"
          title={rootInfo?.root}
          onClick={() => setModal("folder")}
        >
          <FolderIcon size={14} className="shrink-0 text-slate-400" />
          <span className="truncate text-sm font-medium text-slate-700">
            {rootInfo?.name ?? "…"}
          </span>
        </button>
        <IconButton
          title="Import from Squiggle Hub"
          onClick={() => setModal("hub")}
        >
          <GlobeIcon size={14} />
        </IconButton>
        <IconButton
          title="Refresh file list"
          onClick={() => void workspace.refreshTree()}
        >
          <RefreshIcon size={14} />
        </IconButton>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-1">
        <FileTree
          nodes={workspace.tree}
          activePath={workspace.activePath}
          dirtyPaths={dirtyPaths}
          onOpen={workspace.openFile}
        />

        {recentFiles.length > 0 && (
          <>
            <SectionTitle>Recent files</SectionTitle>
            <ul className="pb-1">
              {recentFiles.slice(0, 6).map((p) => (
                <li key={p}>
                  <button
                    type="button"
                    title={p}
                    className="block w-full truncate rounded px-3 py-0.5 text-left text-sm text-slate-600 hover:bg-slate-200/60"
                    onClick={() => workspace.openFile(p)}
                  >
                    {basename(p)}
                    {p.includes("/") && (
                      <span className="ml-1.5 text-xs text-slate-400">
                        {p.slice(0, p.lastIndexOf("/"))}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {workspace.recentFolders.length > 1 && (
          <>
            <SectionTitle>Recent folders</SectionTitle>
            <ul className="pb-3">
              {workspace.recentFolders
                .filter((f) => f.path !== rootInfo?.root)
                .slice(0, 5)
                .map((f) => (
                  <li key={f.path}>
                    <button
                      type="button"
                      title={f.path}
                      className="block w-full truncate rounded px-3 py-0.5 text-left text-sm text-slate-600 hover:bg-slate-200/60"
                      onClick={() => void workspace.openFolder(f.path)}
                    >
                      {basename(
                        f.path.replace(/[\\/]$/, "").replace(/\\/g, "/")
                      )}
                    </button>
                  </li>
                ))}
            </ul>
          </>
        )}
      </div>

      {modal === "folder" && rootInfo && (
        <OpenFolderModal
          currentRoot={rootInfo.root}
          recentFolders={workspace.recentFolders}
          onOpen={workspace.openFolder}
          close={() => setModal(null)}
        />
      )}
      {modal === "hub" && (
        <HubImportModal
          onImported={workspace.openFile}
          close={() => setModal(null)}
        />
      )}
    </aside>
  );
};
