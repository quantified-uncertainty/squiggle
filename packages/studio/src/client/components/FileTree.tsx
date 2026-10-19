import { clsx } from "clsx";
import {
  FC,
  Fragment,
  KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

import { ChevronRightIcon } from "@quri/ui";

import { TID } from "../../shared/testIds.js";
import { focusMain, useFocuser } from "../commands/focus.js";
import { runCommand, useCommand } from "../commands/registry.js";
import {
  consumeReveal,
  endNameInput,
  getExplorerUi,
  NAME_MESSAGES,
  type NameInputRequest,
  newFileTemplate,
  resolveNameInput,
  setCursor,
  treeKeyCommand,
  useExplorerUi,
} from "../lib/explorerUi.js";
import { host } from "../lib/host.js";
import { reportBusy } from "../lib/idle.js";
import { useSetting } from "../lib/studioState.js";
import {
  allPaths,
  ancestorsOf,
  cursorAfterDelete,
  findNode,
  firstChild,
  firstRow,
  flattenVisible,
  foldersContaining,
  lastRow,
  nearestVisibleAncestor,
  next,
  pageBy,
  parent,
  prev,
  type TreeRow,
} from "../lib/treeNav.js";
import type { TreeState } from "../lib/useTreeState.js";
import { isDirty, useWorkspaceContext } from "../lib/workspaceTypes.js";
import { FileIcon, FolderIcon, SquiggleIcon } from "./icons.js";
import { InlineNameInput } from "./InlineNameInput.js";
import { primaryKeyLabel } from "./Kbd.js";

// The Explorer's tree (§3.9.1): one tab stop (`role="tree"` with
// aria-activedescendant) over a flattened list of the visible rows. The
// cursor (the focus ring) is separate from the shown file (bold background).
// While the tree doesn't have focus, the cursor follows the shown file and
// the tree reveals it. ↑/↓ open the file under the cursor 150 ms after the
// key is released (`explorer.openOnArrow`); a click shows the file and gives
// the tree keyboard focus, so the next ↓ moves on from there.

export const ROW_HEIGHT = 22; // px
const ARROW_OPEN_MS = 150;
const ARROW_BUSY_KEY = "explorer:open-on-arrow";

const indent = (depth: number) => ({ paddingLeft: 6 + depth * 12 });

// A DOM id for a row (aria-activedescendant needs ids without spaces).
function rowDomId(prefix: string, path: string): string {
  return `${prefix}-${path.replace(/[^\w-]/g, (c) => `_${c.charCodeAt(0).toString(16)}`)}`;
}

type Props = {
  treeState: TreeState;
  // A root banner is shown: dimmed and not interactive (#56).
  blocked: boolean;
};

export const FileTree: FC<Props> = ({ treeState, blocked }) => {
  const workspace = useWorkspaceContext();
  const { tree, activePath, files, externalChanges } = workspace;
  const openOnArrow = useSetting("explorer.openOnArrow");
  const cursor = useExplorerUi((s) => s.cursor);
  const input = useExplorerUi((s) => s.input);
  const reveal = useExplorerUi((s) => s.reveal);
  const treeRef = useRef<HTMLDivElement>(null);
  const idPrefix = useId().replace(/:/g, "");
  const rowId = useCallback(
    (path: string) => rowDomId(`ft${idPrefix}`, path),
    [idPrefix]
  );

  const rows = useMemo(
    () => flattenVisible(tree, treeState.expanded),
    [tree, treeState.expanded]
  );
  const latest = useRef({ rows, tree, activePath, workspace, treeState });
  latest.current = { rows, tree, activePath, workspace, treeState };

  const dirtyPaths = useMemo(
    () =>
      new Set(
        Object.values(files)
          .filter(isDirty)
          .map((f) => f.path)
      ),
    [files]
  );
  const unseenChanges = useMemo(
    () =>
      new Set(
        Object.entries(externalChanges)
          .filter(([, c]) => !c.seen && c.exists)
          .map(([p]) => p)
      ),
    [externalChanges]
  );
  const foldersWithChanges = useMemo(
    () => foldersContaining(unseenChanges),
    [unseenChanges]
  );
  const renameKey = primaryKeyLabel("renameFile");

  // ── Scrolling ─────────────────────────────────────────────────────────

  // Scroll the cursor's row into view when the cursor moves, and a revealed
  // row once it is rendered (its folders may expand first).
  const scrolledFor = useRef<string | null>(null);
  const pendingScroll = useRef<string | null>(null);
  useLayoutEffect(() => {
    const target =
      pendingScroll.current ?? (cursor !== scrolledFor.current ? cursor : null);
    if (target === null) return;
    const el = document.getElementById(rowId(target));
    if (!el) return;
    el.scrollIntoView({ block: "nearest" });
    pendingScroll.current = null;
    scrolledFor.current = cursor;
  }, [cursor, rows, rowId]);

  // Expands the folders containing `path`, moves the cursor there and
  // scrolls its row into view.
  const revealPath = useCallback((path: string) => {
    latest.current.treeState.expand(ancestorsOf(path));
    setCursor(path);
    pendingScroll.current = path;
  }, []);

  // While the tree doesn't have focus, the cursor follows the shown file and
  // the tree reveals it, also once a file created or renamed into a collapsed
  // folder appears in the tree (#43).
  const activeInTree =
    activePath !== null && findNode(tree, activePath) !== undefined;
  useEffect(() => {
    if (activePath === null || !activeInTree) return;
    if (treeRef.current && document.activeElement === treeRef.current) return;
    revealPath(activePath);
  }, [activePath, activeInTree, revealPath]);

  // Explicit requests (Reveal Active File in Explorer, Rename from a menu).
  const revealSeq = reveal?.seq;
  useEffect(() => {
    const request = getExplorerUi().reveal;
    if (!request) return;
    revealPath(request.path);
    consumeReveal(request.seq);
  }, [revealSeq, revealPath]);

  // When rows change (tree-changed, a collapse), the cursor stays on its path
  // if visible; a collapsed one moves to its folder; a deleted one to the
  // row at its index, else its parent.
  const previousRows = useRef(rows);
  useEffect(() => {
    const before = previousRows.current;
    previousRows.current = rows;
    const current = getExplorerUi().cursor;
    if (current === null || rows.some((r) => r.path === current)) return;
    const stillExists = allPaths(tree).has(current);
    setCursor(
      stillExists
        ? (nearestVisibleAncestor(rows, current) ?? firstRow(rows) ?? null)
        : cursorAfterDelete(before, rows, current)
    );
  }, [rows, tree]);

  // ── Opening ───────────────────────────────────────────────────────────

  // Open-on-arrow: a file under the cursor is shown once no key follows for
  // 150 ms. For a key press, the wait starts when the key is released, so
  // holding ↓ opens nothing until then. Busy (for whenIdle) while pending.
  const arrowTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const arrowPending = useRef(false);
  const keyDown = useRef(false);

  const setArrowPending = (pending: boolean) => {
    if (arrowPending.current === pending) return;
    arrowPending.current = pending;
    reportBusy(ARROW_BUSY_KEY, pending);
  };
  const cancelArrowOpen = useCallback(() => {
    clearTimeout(arrowTimer.current);
    arrowTimer.current = undefined;
    setArrowPending(false);
  }, []);
  const fireArrowOpen = useCallback(() => {
    arrowTimer.current = undefined;
    setArrowPending(false);
    const { rows, activePath, workspace } = latest.current;
    const path = getExplorerUi().cursor;
    const row = rows.find((r) => r.path === path);
    if (row?.kind === "file" && row.path !== activePath) {
      workspace.openFile(row.path, { reason: "tree-arrow", focus: "keep" });
    }
  }, []);
  const startArrowTimer = useCallback(() => {
    clearTimeout(arrowTimer.current);
    arrowTimer.current = setTimeout(fireArrowOpen, ARROW_OPEN_MS);
  }, [fireArrowOpen]);

  useEffect(() => cancelArrowOpen, [cancelArrowOpen]);

  // Moves the cursor (keys and `list.*` commands).
  const move = (path: string | undefined) => {
    if (path === undefined) return;
    setCursor(path);
    const row = latest.current.rows.find((r) => r.path === path);
    if (
      openOnArrow &&
      row?.kind === "file" &&
      row.path !== latest.current.activePath
    ) {
      setArrowPending(true);
      if (keyDown.current) clearTimeout(arrowTimer.current);
      else startArrowTimer();
    } else {
      cancelArrowOpen();
    }
  };

  const open = (path: string, focus: "keep" | "main") => {
    cancelArrowOpen();
    const { activePath, workspace } = latest.current;
    if (path !== activePath) {
      workspace.openFile(path, { reason: "tree", focus });
    }
    if (focus === "main") {
      // After React has shown the file (its editor may still be loading).
      requestAnimationFrame(() => void focusMain({ retryMs: 1500 }));
    }
  };

  const toggle = (row: TreeRow) =>
    latest.current.treeState.setExpanded(row.path, !row.expanded);

  // ── Region commands (§5.3) ────────────────────────────────────────────

  const cursorRow = (): TreeRow | undefined => {
    const path = getExplorerUi().cursor;
    return latest.current.rows.find((r) => r.path === path);
  };
  const pageSize = () =>
    Math.max(
      1,
      Math.floor((treeRef.current?.clientHeight ?? ROW_HEIGHT) / ROW_HEIGHT) - 1
    );

  useCommand("list.focusDown", () =>
    move(next(latest.current.rows, getExplorerUi().cursor))
  );
  useCommand("list.focusUp", () =>
    move(prev(latest.current.rows, getExplorerUi().cursor))
  );
  useCommand("list.focusFirst", () => move(firstRow(latest.current.rows)));
  useCommand("list.focusLast", () => move(lastRow(latest.current.rows)));
  useCommand("list.focusPageDown", () =>
    move(pageBy(latest.current.rows, getExplorerUi().cursor, pageSize()))
  );
  useCommand("list.focusPageUp", () =>
    move(pageBy(latest.current.rows, getExplorerUi().cursor, -pageSize()))
  );
  useCommand("list.expand", () => {
    const row = cursorRow();
    if (!row) return move(firstRow(latest.current.rows));
    if (row.kind !== "dir") return;
    if (!row.expanded) toggle(row);
    else move(firstChild(latest.current.rows, row.path));
  });
  useCommand("list.collapse", () => {
    const row = cursorRow();
    if (!row) return move(firstRow(latest.current.rows));
    if (row.kind === "dir" && row.expanded) toggle(row);
    else move(parent(latest.current.rows, row.path));
  });
  useCommand("explorer.openAndPassFocus", () => {
    const row = cursorRow();
    if (!row) return;
    if (row.kind === "dir") toggle(row);
    else open(row.path, "main");
  });
  useCommand("filesExplorer.openFilePreserveFocus", () => {
    const row = cursorRow();
    if (!row) return;
    if (row.kind === "dir") toggle(row);
    else open(row.path, "keep");
  });

  // The tree focuser (F6, ⇧⌘E): the cursor is the shown file, revealed
  // first.
  useFocuser(
    "tree",
    useCallback(() => {
      const el = treeRef.current;
      if (!el || el.closest("[inert]")) return false;
      const { activePath, tree, rows } = latest.current;
      if (document.activeElement !== el) {
        if (activePath !== null && findNode(tree, activePath)) {
          revealPath(activePath);
        } else if (getExplorerUi().cursor === null) {
          setCursor(firstRow(rows) ?? null);
        }
      }
      el.focus();
      return document.activeElement === el;
    }, [revealPath])
  );

  // ── Keys ──────────────────────────────────────────────────────────────

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    // Keys typed into the inline name input stay there.
    if (e.target !== e.currentTarget) return;
    const match = treeKeyCommand(e.nativeEvent, host.platform, host.kind);
    if (!match) return;
    e.preventDefault();
    keyDown.current = true;
    if (e.repeat && !match.spec.repeatable) return;
    runCommand(match.id, undefined, "key");
  };
  const onKeyUp = () => {
    keyDown.current = false;
    if (arrowPending.current) startArrowTimer();
  };

  // ── Inline name input ─────────────────────────────────────────────────

  const submitName = async (
    request: NameInputRequest & { id: number },
    value: string
  ) => {
    const { workspace, tree } = latest.current;
    const result = resolveNameInput(
      value,
      request.mode === "rename"
        ? { mode: "rename", from: request.from }
        : { mode: "create" }
    );
    if (!result.ok) throw new Error(result.error);
    if (request.mode === "rename" && result.path === request.from) {
      endNameInput(request.id);
      request.restoreFocus?.();
      return;
    }
    if (allPaths(tree).has(result.path)) {
      throw new Error(NAME_MESSAGES.exists(result.path));
    }
    if (request.mode === "create") {
      const path = await workspace.createFile(
        result.path,
        newFileTemplate(result.path)
      );
      if (getExplorerUi().input?.id !== request.id) return; // cancelled meanwhile
      endNameInput(request.id);
      revealPath(path);
      open(path, "main");
    } else {
      const to = await workspace.renameFile(request.from, result.path);
      if (getExplorerUi().input?.id !== request.id) return;
      endNameInput(request.id);
      revealPath(to);
      // Back where the rename started (the tree, with the cursor on the new
      // path, or the editor).
      request.restoreFocus?.();
    }
  };

  const cancelName = (request: NameInputRequest & { id: number }) => {
    endNameInput(request.id);
    request.restoreFocus?.();
  };

  const renderInput = (
    request: NameInputRequest & { id: number },
    depth: number
  ) => (
    <InlineNameInput
      key={request.id}
      mode={request.mode}
      initialValue={request.value}
      selection={request.selection}
      style={indent(depth)}
      onSubmit={(value) => submitName(request, value)}
      onCancel={() => cancelName(request)}
    />
  );

  // Where a create input goes: first child of its folder, or the top.
  const createDir =
    input?.mode === "create" &&
    input.dir &&
    rows.some((r) => r.path === input.dir && r.kind === "dir" && r.expanded)
      ? input.dir
      : "";

  // ── Render ────────────────────────────────────────────────────────────

  const renderRow = (row: TreeRow) => {
    const isCursor = row.path === cursor;
    const isShown = row.path === activePath;
    const dirty = row.kind === "file" && dirtyPaths.has(row.path);
    const changed =
      row.kind === "file"
        ? unseenChanges.has(row.path)
        : !row.expanded && foldersWithChanges.has(row.path);
    return (
      <div
        key={row.path}
        id={rowId(row.path)}
        role="treeitem"
        aria-level={row.depth + 1}
        aria-expanded={row.kind === "dir" ? row.expanded : undefined}
        aria-selected={isShown}
        data-testid={TID.fileTreeItem}
        data-path={row.path}
        data-kind={row.kind}
        data-dirty={dirty ? "1" : "0"}
        data-changed={changed ? "1" : "0"}
        data-cursor={isCursor ? "1" : undefined}
        title={
          row.kind === "file" && renameKey
            ? `${row.path} — ${renameKey} to rename`
            : row.path
        }
        className={clsx(
          "flex cursor-pointer select-none items-center gap-1 pr-2 text-[13px]",
          isShown
            ? "bg-slate-200 font-medium text-slate-900"
            : "text-slate-700 hover:bg-slate-200/60",
          // The cursor ring shows while the tree has focus.
          isCursor &&
            "group-focus/tree:ring-2 group-focus/tree:ring-inset group-focus/tree:ring-orange-300"
        )}
        style={{ ...indent(row.depth), height: ROW_HEIGHT }}
        onMouseDown={(e) => {
          // No text selection on double-click.
          if (e.detail > 1) e.preventDefault();
        }}
        onClick={() => {
          setCursor(row.path);
          if (row.kind === "dir") {
            cancelArrowOpen();
            toggle(row);
          } else {
            open(row.path, "keep");
          }
          treeRef.current?.focus();
        }}
        onDoubleClick={() => {
          if (row.kind === "file") open(row.path, "main");
        }}
      >
        {row.kind === "dir" ? (
          <ChevronRightIcon
            size={12}
            className={clsx(
              "shrink-0 text-slate-500",
              row.expanded && "rotate-90"
            )}
          />
        ) : (
          <span className="w-3 shrink-0" />
        )}
        {row.kind === "dir" ? (
          <FolderIcon size={14} className="shrink-0 text-slate-500" />
        ) : row.name.endsWith(".squiggle") ? (
          <SquiggleIcon size={14} className="shrink-0 text-orange-500" />
        ) : (
          <FileIcon size={14} className="shrink-0 text-slate-500" />
        )}
        <span className="min-w-0 flex-1 truncate">{row.name}</span>
        {changed && (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
            aria-hidden
          />
        )}
        {changed && <span className="sr-only">, changed on disk</span>}
        {dirty && (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-600"
            aria-hidden
          />
        )}
        {dirty && <span className="sr-only">, unsaved</span>}
      </div>
    );
  };

  return (
    <div
      ref={treeRef}
      role="tree"
      aria-label="Files"
      tabIndex={blocked ? -1 : 0}
      aria-activedescendant={
        cursor !== null && rows.some((r) => r.path === cursor)
          ? rowId(cursor)
          : undefined
      }
      data-testid={TID.fileTree}
      // `relative` keeps the rows' sr-only text inside the scroll area.
      className="group/tree relative min-h-0 flex-1 overflow-auto py-1 outline-none"
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onFocus={(e) => {
        // With no cursor yet, start on the shown file (or the first row). A
        // cursor that isn't visible is handled by the rows effect above.
        if (e.target !== e.currentTarget) return;
        if (getExplorerUi().cursor !== null) return;
        const { rows, activePath } = latest.current;
        setCursor(
          activePath !== null && rows.some((r) => r.path === activePath)
            ? activePath
            : (firstRow(rows) ?? null)
        );
      }}
      onBlur={() => {
        // A key released outside the page never reaches onKeyUp.
        keyDown.current = false;
        if (arrowPending.current) startArrowTimer();
      }}
    >
      {input?.mode === "create" && createDir === "" && renderInput(input, 0)}
      {rows.map((row) => {
        if (input?.mode === "rename" && input.from === row.path) {
          return (
            <div key={row.path} role="none">
              {renderInput(input, row.depth)}
            </div>
          );
        }
        if (input?.mode === "create" && createDir === row.path) {
          return (
            <Fragment key={row.path}>
              {renderRow(row)}
              {renderInput(input, row.depth + 1)}
            </Fragment>
          );
        }
        return renderRow(row);
      })}
    </div>
  );
};
