import { clsx } from "clsx";
import {
  FC,
  PointerEvent as ReactPointerEvent,
  useId,
  useMemo,
  useState,
} from "react";
import { z } from "zod";

import {
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  RefreshIcon,
} from "@quri/ui";

import type { MenuNode } from "../../shared/commands/index.js";
import { basename, dirname } from "../../shared/paths.js";
import { TID } from "../../shared/testIds.js";
import {
  displayFolderPath,
  folderName,
  folderParent,
} from "../lib/explorerUi.js";
import {
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  useLayout,
} from "../lib/stores/layout.js";
import { useRootState } from "../lib/studioState.js";
import { formatAgo, useNow } from "../lib/time.js";
import { useTreeState } from "../lib/useTreeState.js";
import { useWorkspaceContext } from "../lib/workspaceTypes.js";
import { CommandButton } from "./CommandButton.js";
import { FileTree } from "./FileTree.js";
import { CollapseAllIcon, FolderPlusIcon } from "./icons.js";
import { PopupMenu } from "./menu/PopupMenu.js";

// The Explorer (§3.9): a header with the folder switcher and file actions,
// the pinned "Changed on disk" section, the keyboard tree (the only scroll
// area) and a footer for folders that couldn't be read (#4). Width and
// visibility are global layout state; the resize handle clamps to 180–480 px.

const MAX_RECENT_FOLDERS = 8;
const CHANGES_SHOWN = 5;

const clampWidth = (w: number) =>
  Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, w));

// The width, with a live value while the handle is dragged; stored once the
// drag ends.
function useExplorerWidth() {
  const [stored, setStored] = useLayout("sidebarWidth");
  const [dragging, setDragging] = useState<number | undefined>();
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = stored;
    let latest = startWidth;
    const onMove = (ev: PointerEvent) => {
      latest = clampWidth(startWidth + ev.clientX - startX);
      setDragging(latest);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
      setStored(latest);
      setDragging(undefined);
    };
    document.body.style.cursor = "col-resize";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };
  return { width: clampWidth(dragging ?? stored), onPointerDown };
}

// The folder name; with Open Folder allowed, a menu of recent folders and
// "Open Folder…" (#31, #51, #60).
const FolderSwitcher: FC = () => {
  const { rootInfo, recentFolders } = useWorkspaceContext();
  const name = rootInfo?.name ?? "…";
  const labelClass =
    "truncate text-[11px] font-semibold uppercase tracking-wider text-slate-600";

  const items = useMemo((): MenuNode[] => {
    const recent = recentFolders
      .filter((f) => f.path !== rootInfo?.root)
      .slice(0, MAX_RECENT_FOLDERS);
    const recentNodes: MenuNode[] = recent.length
      ? [
          { header: "Recent folders" },
          ...recent.map(
            (f): MenuNode => ({
              command: "squiggle.openRecentFolder",
              args: { path: f.path },
              title: `${folderName(f.path)} — ${folderParent(f.path)}`,
            })
          ),
          { separator: true },
        ]
      : [];
    return [...recentNodes, { command: "workbench.action.files.openFolder" }];
  }, [recentFolders, rootInfo?.root]);

  if (!rootInfo?.allowOpenFolder) {
    return (
      <span className={clsx("min-w-0 px-2", labelClass)} title={rootInfo?.root}>
        {name}
      </span>
    );
  }
  const current = displayFolderPath(rootInfo.root);
  return (
    <PopupMenu
      label={`Open folder… (current: ${current})`}
      title={`Open folder… (current: ${current})`}
      menuId="explorer-folder"
      items={items}
      triggerClassName="flex h-6 min-w-0 max-w-full items-center gap-1 rounded px-2 hover:bg-slate-200 aria-expanded:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
      trigger={
        <>
          <span className={labelClass}>{name}</span>
          <ChevronDownIcon size={12} className="shrink-0 text-slate-500" />
        </>
      }
    />
  );
};

const ExplorerHeader: FC = () => (
  <div
    data-testid={TID.explorerHeader}
    className="group flex h-9 shrink-0 items-center gap-1 border-b border-slate-200 pl-1 pr-1.5"
  >
    <div className="min-w-0 flex-1">
      <FolderSwitcher />
    </div>
    <div className="flex shrink-0 items-center opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
      <CommandButton
        command="explorer.newFile"
        icon={<PlusIcon size={14} />}
        placement="top"
      />
      <CommandButton
        command="explorer.newFolder"
        icon={<FolderPlusIcon size={14} />}
        placement="top"
      />
      <CommandButton
        command="workbench.files.action.collapseExplorerFolders"
        icon={<CollapseAllIcon size={14} />}
        placement="top"
      />
      <CommandButton
        command="squiggle.refreshTree"
        icon={<RefreshIcon size={14} />}
        placement="top"
      />
    </div>
  </div>
);

const CHANGED_COLLAPSED_KEY = "explorer.changedOnDiskCollapsed";

// Files changed on disk by someone else (an agent), newest first: pinned
// above the tree so it stays visible (#20), with folder hints for files of
// the same name (#55). Deleted entries are struck through and disabled.
const ChangedOnDisk: FC = () => {
  const workspace = useWorkspaceContext();
  const root = workspace.rootInfo?.root;
  const [stored, setStored] = useRootState(
    root,
    CHANGED_COLLAPSED_KEY,
    z.boolean(),
    false
  );
  const [local, setLocal] = useState<boolean | undefined>();
  const collapsed = local ?? stored;
  const [showAll, setShowAll] = useState(false);
  const now = useNow(5000);
  const listId = useId();

  const entries = useMemo(
    () =>
      Object.entries(workspace.externalChanges).sort(
        ([, a], [, b]) => b.at - a.at
      ),
    [workspace.externalChanges]
  );
  if (!entries.length) return null;
  const unseen = entries.filter(([, c]) => !c.seen && c.exists).length;
  const shown = showAll ? entries : entries.slice(0, CHANGES_SHOWN);
  const hidden = entries.length - shown.length;

  return (
    <section
      aria-label="Changed on disk"
      data-testid={TID.changedOnDisk}
      className="shrink-0 border-b border-slate-200"
    >
      <div className="flex h-7 items-center gap-1 pl-1 pr-1.5">
        <button
          type="button"
          aria-expanded={!collapsed}
          aria-controls={listId}
          className="flex h-6 min-w-0 flex-1 items-center gap-1 rounded px-1 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600 hover:bg-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          onClick={() => {
            setLocal(!collapsed);
            setStored(!collapsed);
          }}
        >
          <ChevronRightIcon
            size={12}
            className={clsx(
              "shrink-0 text-slate-500",
              !collapsed && "rotate-90"
            )}
          />
          <span className="truncate">Changed on disk</span>
          <span
            className={clsx(
              "shrink-0 rounded-full px-1.5 text-[10px] font-semibold tabular-nums tracking-normal",
              unseen > 0
                ? "bg-amber-100 text-amber-900"
                : "bg-slate-200 text-slate-700"
            )}
            title={`${entries.length} changed, ${unseen} not viewed yet`}
          >
            {entries.length}
          </span>
        </button>
        <button
          type="button"
          aria-label="Clear the Changed on disk list"
          className="h-6 shrink-0 rounded px-1.5 text-[11px] text-slate-600 hover:bg-slate-200 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          onClick={() => workspace.clearChanges()}
        >
          Clear
        </button>
      </div>
      {!collapsed && (
        <ul id={listId} className="relative max-h-32 overflow-auto pb-1">
          {shown.map(([path, change]) => {
            const folder = dirname(path);
            return (
              <li key={path}>
                <button
                  type="button"
                  data-testid={TID.changedOnDiskItem}
                  data-path={path}
                  data-exists={change.exists ? "1" : "0"}
                  data-seen={change.seen ? "1" : "0"}
                  disabled={!change.exists}
                  title={change.exists ? path : `${path} (deleted on disk)`}
                  className={clsx(
                    "flex h-[22px] w-full items-center gap-1.5 pl-3 pr-2 text-left text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-300",
                    change.exists
                      ? "text-slate-700 hover:bg-slate-200/60"
                      : "cursor-default text-slate-500"
                  )}
                  onClick={() => workspace.openFile(path, { reason: "tree" })}
                >
                  <span
                    aria-hidden
                    className={clsx(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      !change.seen && change.exists && "bg-amber-500"
                    )}
                  />
                  <span
                    className={clsx(
                      "min-w-0 shrink-0 truncate",
                      !change.exists && "line-through",
                      !change.seen && change.exists && "font-medium"
                    )}
                  >
                    {basename(path)}
                  </span>
                  {folder && (
                    <span className="min-w-0 truncate text-xs text-slate-500">
                      {folder}
                    </span>
                  )}
                  {!change.exists && <span className="sr-only">(deleted)</span>}
                  <span
                    data-volatile
                    className="ml-auto shrink-0 pl-1 text-xs text-slate-500"
                  >
                    {formatAgo(change.at, now)}
                  </span>
                </button>
              </li>
            );
          })}
          {hidden > 0 && (
            <li>
              <button
                type="button"
                className="h-[22px] pl-6 pr-2 text-xs text-slate-600 hover:text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
                onClick={() => setShowAll(true)}
              >
                +{hidden} more
              </button>
            </li>
          )}
        </ul>
      )}
    </section>
  );
};

// The folder or its tree failed to load (the server is down, the folder is
// unreadable): the reason and a retry, instead of "Loading files…" forever.
const TreeErrorNotice: FC<{ error: string }> = ({ error }) => (
  <div
    role="alert"
    className="flex items-start gap-1 px-3 py-2 text-xs text-red-700"
  >
    <span className="min-w-0 flex-1 break-words">
      Couldn't load the folder: {error}
    </span>
    <CommandButton
      command="squiggle.refreshTree"
      icon={<RefreshIcon size={14} />}
      label="Retry"
      placement="right"
    />
  </div>
);

// "1 folder couldn't be read", with the paths in its tooltip (#4).
const SkippedFooter: FC<{ skipped: string[] }> = ({ skipped }) => (
  <div
    className="shrink-0 border-t border-slate-200 px-3 py-1 text-[11px] text-slate-600"
    title={skipped.join("\n")}
  >
    {skipped.length === 1
      ? "1 folder couldn't be read"
      : `${skipped.length} folders couldn't be read`}
  </div>
);

export const Explorer: FC = () => {
  const workspace = useWorkspaceContext();
  const { width, onPointerDown } = useExplorerWidth();
  const treeState = useTreeState(workspace.rootInfo?.root, workspace.tree);
  // Another window switched folders, or the folder is gone: the tree is
  // dimmed and not interactive (#56).
  const blocked =
    workspace.rootChangedTo !== undefined || workspace.rootMissing;
  const empty =
    workspace.treeLoaded &&
    workspace.tree.length === 0 &&
    workspace.treeError === undefined;

  return (
    <div className="flex h-full shrink-0" style={{ width }}>
      <aside
        aria-label="Explorer"
        data-testid={TID.explorer}
        data-studio-region="tree"
        className="flex min-w-0 flex-1 flex-col bg-slate-50"
      >
        <ExplorerHeader />
        <div
          className={clsx(
            "flex min-h-0 flex-1 flex-col",
            blocked && "pointer-events-none opacity-60"
          )}
          inert={blocked}
          aria-disabled={blocked || undefined}
        >
          <ChangedOnDisk />
          {workspace.treeError !== undefined && workspace.tree.length === 0 ? (
            <TreeErrorNotice error={workspace.treeError} />
          ) : (
            !workspace.treeLoaded && (
              <div className="px-3 py-2 text-xs text-slate-600">
                Loading files…
              </div>
            )
          )}
          {empty && (
            <div className="px-3 py-2 text-xs text-slate-600">
              No .squiggle, .json or .md files in this folder yet.
            </div>
          )}
          <FileTree treeState={treeState} blocked={blocked} />
          {workspace.treeSkipped.length > 0 && (
            <SkippedFooter skipped={workspace.treeSkipped} />
          )}
        </div>
      </aside>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize Explorer"
        aria-valuenow={width}
        aria-valuemin={SIDEBAR_MIN_WIDTH}
        aria-valuemax={SIDEBAR_MAX_WIDTH}
        className="w-1 shrink-0 cursor-col-resize border-r border-slate-200 bg-slate-50 hover:bg-orange-200"
        onPointerDown={onPointerDown}
      />
    </div>
  );
};
