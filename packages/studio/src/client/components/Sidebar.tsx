import {
  FC,
  PointerEvent as ReactPointerEvent,
  PropsWithChildren,
  useMemo,
  useState,
} from "react";
import { z } from "zod";

import { GlobeIcon, PlusIcon, RefreshIcon, TextTooltip } from "@quri/ui";

import { isDirty, type Workspace } from "../lib/useWorkspace.js";
import { basename } from "../lib/paths.js";
import { readStorage, writeStorage } from "../lib/storage.js";
import { formatAgo, useNow } from "../lib/time.js";
import { FileTree } from "./FileTree.js";
import { InlineNameInput, withExtension } from "./InlineNameInput.js";
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

function newFileTemplate(path: string): string {
  if (!path.endsWith(".squiggle")) return "";
  return `// ${basename(path)}\n\n@name("Estimate")\nestimate = 1 to 10\n`;
}

const widthKey = "squiggle-studio:sidebar-width";
const MIN_WIDTH = 180;
const MAX_WIDTH = 480;
const clampWidth = (w: number) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, w));

// Drag handle on the sidebar's right edge.
function useSidebarWidth() {
  const [width, setWidth] = useState(
    () => readStorage(widthKey, z.number()) ?? 256
  );
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;
    let latest = startWidth;
    const onMove = (ev: PointerEvent) => {
      latest = clampWidth(startWidth + ev.clientX - startX);
      setWidth(latest);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
      writeStorage(widthKey, latest);
    };
    document.body.style.cursor = "col-resize";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };
  return { width: clampWidth(width), onPointerDown };
}

export const Sidebar: FC<{ workspace: Workspace }> = ({ workspace }) => {
  const { width, onPointerDown } = useSidebarWidth();
  const [modal, setModal] = useState<"folder" | "hub" | null>(null);
  const [creating, setCreating] = useState(false);
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

  const now = useNow(5000);
  const changes = Object.entries(workspace.externalChanges)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="flex h-full shrink-0" style={{ width }}>
      <aside className="flex min-w-0 flex-1 flex-col bg-slate-50">
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
          <IconButton title="New file" onClick={() => setCreating(true)}>
            <PlusIcon size={14} />
          </IconButton>
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
          {creating && (
            <InlineNameInput
              initialValue="untitled.squiggle"
              style={{ paddingLeft: 8 }}
              onCancel={() => setCreating(false)}
              onSubmit={async (value) => {
                const path = withExtension(value);
                await workspace.createFile(path, newFileTemplate(path));
                setCreating(false);
              }}
            />
          )}
          <FileTree
            nodes={workspace.tree}
            activePath={workspace.activePath}
            dirtyPaths={dirtyPaths}
            externalChanges={workspace.externalChanges}
            onOpen={workspace.openFile}
            onRename={workspace.renameFile}
          />

          {changes.length > 0 && (
            <>
              <SectionTitle>Changed on disk</SectionTitle>
              <ul className="pb-1">
                {changes.map(([p, at]) => (
                  <li key={p}>
                    <button
                      type="button"
                      title={p}
                      className="flex w-full items-baseline gap-2 rounded px-3 py-0.5 text-left text-sm text-slate-600 hover:bg-slate-200/60"
                      onClick={() => workspace.openFile(p)}
                    >
                      <span className="truncate">{basename(p)}</span>
                      <span className="ml-auto shrink-0 text-xs text-slate-400">
                        {formatAgo(at, now)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

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

        <div className="flex items-center gap-2 border-t border-slate-200 px-3 py-2 text-xs text-slate-500">
          <TextTooltip
            text={
              workspace.connected
                ? "Changes to files on disk (e.g. by a coding agent) show up automatically."
                : "Lost connection to the Studio server. Retrying…"
            }
            placement="top"
          >
            <span className="flex items-center gap-1.5">
              <span
                className={
                  workspace.connected
                    ? "h-2 w-2 rounded-full bg-emerald-500"
                    : "h-2 w-2 animate-pulse rounded-full bg-amber-500"
                }
              />
              {workspace.connected ? "Live" : "Reconnecting…"}
            </span>
          </TextTooltip>
          <TextTooltip
            text="Open files automatically when they change on disk, e.g. while a coding agent works."
            placement="top"
          >
            <label className="ml-auto flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
                checked={workspace.followChanges}
                onChange={(e) => workspace.setFollowChanges(e.target.checked)}
              />
              Follow changes
            </label>
          </TextTooltip>
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
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        className="w-1 shrink-0 cursor-col-resize border-r border-slate-200 bg-slate-50 hover:bg-orange-200"
        onPointerDown={onPointerDown}
      />
    </div>
  );
};
