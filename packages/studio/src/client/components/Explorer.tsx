import {
  FC,
  PointerEvent as ReactPointerEvent,
  PropsWithChildren,
  useMemo,
  useState,
} from "react";
import { z } from "zod";

import { GlobeIcon, PlusIcon, RefreshIcon, TextTooltip } from "@quri/ui";

import { basename } from "../../shared/paths.js";
import { TID } from "../../shared/testIds.js";
import { readStorage, writeStorage } from "../lib/storage.js";
import { formatAgo, useNow } from "../lib/time.js";
import { isDirty, useWorkspaceContext } from "../lib/workspaceTypes.js";
import { FileTree } from "./FileTree.js";
import { HubImportModal } from "./HubImportModal.js";
import { FolderIcon } from "./icons.js";
import { InlineNameInput, withExtension } from "./InlineNameInput.js";
import { OpenFolderModal } from "./OpenFolderModal.js";

const SectionTitle: FC<PropsWithChildren> = ({ children }) => (
  <div className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
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

// WP0 stub (owned by WP3): the former Sidebar, renamed and reading the
// workspace from context. The brand row moved to the application header and
// the Live/Follow footer to the status bar; WP3 rebuilds the rest (§3.9).
export const Explorer: FC = () => {
  const workspace = useWorkspaceContext();
  const { width, onPointerDown } = useSidebarWidth();
  const [modal, setModal] = useState<"folder" | "hub" | null>(null);
  const [creating, setCreating] = useState(false);
  const { rootInfo, files } = workspace;
  const allowOpenFolder = rootInfo?.allowOpenFolder !== false;

  const dirtyPaths = useMemo(
    () =>
      new Set(
        Object.values(files)
          .filter(isDirty)
          .map((f) => f.path)
      ),
    [files]
  );

  const recentFiles = workspace.mru.filter((p) => p !== workspace.activePath);

  const now = useNow(5000);
  const changedAt = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(workspace.externalChanges).map(([p, c]) => [p, c.at])
      ),
    [workspace.externalChanges]
  );
  const changes = Object.entries(changedAt)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="flex h-full shrink-0" style={{ width }}>
      <aside
        aria-label="Explorer"
        data-testid={TID.explorer}
        data-studio-region="tree"
        className="flex min-w-0 flex-1 flex-col bg-slate-50"
      >
        <div
          data-testid={TID.explorerHeader}
          className="flex h-9 shrink-0 items-center gap-1 border-b border-slate-200 px-2"
        >
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-1.5 rounded px-1 py-1 text-left hover:bg-slate-200"
            title={rootInfo?.root}
            disabled={!allowOpenFolder}
            onClick={() => setModal("folder")}
          >
            <FolderIcon size={14} className="shrink-0 text-slate-500" />
            <span className="truncate text-[11px] font-semibold uppercase tracking-wider text-slate-600">
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
            externalChanges={changedAt}
            onOpen={(p) => workspace.openFile(p, { reason: "tree" })}
            onRename={async (from, to) => {
              await workspace.renameFile(from, to);
            }}
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
                      <span className="ml-auto shrink-0 text-xs text-slate-500">
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
                        <span className="ml-1.5 text-xs text-slate-500">
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
            onImported={(p) => workspace.openFile(p, { reason: "api" })}
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
