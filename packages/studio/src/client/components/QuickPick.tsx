import { clsx } from "clsx";
import {
  FC,
  Fragment,
  KeyboardEvent,
  ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { z } from "zod";

import { TID } from "../../shared/testIds.js";
import { getContext } from "../commands/context.js";
import {
  type CommandRow,
  paletteRows,
  pushRecentCommand,
  type ViewEntry,
} from "../commands/providers/commands.js";
import {
  type FileRow,
  quickOpenRows,
  TREE_FILE_CAP,
} from "../commands/providers/files.js";
import { listCommands, subscribeCommands } from "../commands/registry.js";
import { fuzzyMatch, highlightSegments } from "../lib/fuzzy.js";
import { host } from "../lib/host.js";
import type { QuickPickItem, QuickPickRequest } from "../lib/quickPick.js";
import { useGlobalState } from "../lib/studioState.js";
import { formatAgo, useNow } from "../lib/time.js";
import {
  isDirty,
  treeFilePaths,
  useWorkspaceContext,
} from "../lib/workspaceTypes.js";
import { FileIcon, SquiggleIcon } from "./icons.js";
import { primaryKeyLabel } from "./Kbd.js";
import { eventMatchesCommand, OverlayFrame } from "./OverlayFrame.js";

// ── The generic quick pick (§3.10) ─────────────────────────────────────────

export type QuickPickMode = "files" | "commands" | "pick";

export type QuickPickRow = {
  key: string; // identity (the active row survives list refreshes)
  group?: string; // section header; a group's rows are contiguous
  disabled?: boolean;
  attrs?: Record<`data-${string}`, string>; // data-path / data-command
  content: ReactNode;
};

// What an overlay's own key handler did with a keydown in the input.
type KeyResult = "down" | "handled" | undefined;

type QuickPickProps = {
  mode: QuickPickMode;
  label: string; // the input's and the list's accessible name
  title?: string; // a header above the input (generic pickers)
  value: string;
  placeholder: string;
  onValueChange: (value: string) => void;
  rows: readonly QuickPickRow[];
  emptyText: string;
  notice?: string; // a footer line ("Showing first 5000 files")
  onAccept: (key: string) => void;
  onDismiss: () => void;
  onKey?: (e: KeyboardEvent<HTMLInputElement>) => KeyResult;
};

const PAGE = 10;

// Dim text that stays above 4.5:1 on the active row's blue-100.
const DIM = "text-slate-500 group-data-[active=true]:text-slate-600";

// A combobox (the input keeps focus) over a listbox with
// aria-activedescendant. ↑/↓ (and ⌃N/⌃P on macOS) move and wrap, PgUp/PgDn
// move by a page, Enter accepts, Esc dismisses; pointer hover moves the
// active row and a click accepts it.
export const QuickPick: FC<QuickPickProps> = ({
  mode,
  label,
  title,
  value,
  placeholder,
  onValueChange,
  rows,
  emptyText,
  notice,
  onAccept,
  onDismiss,
  onKey,
}) => {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  // The active row by key; a new query selects the first row again.
  const [selection, setSelection] = useState<{ value: string; key?: string }>({
    value,
  });
  if (selection.value !== value) setSelection({ value });

  const enabled = rows.filter((r) => !r.disabled);
  const active =
    rows.find((r) => r.key === selection.key && !r.disabled) ?? enabled[0];
  const activeIndex = active ? rows.indexOf(active) : -1;
  const optionId = (i: number) => `${listId}-option-${i}`;

  useLayoutEffect(() => {
    inputRef.current?.focus();
  }, []);

  useLayoutEffect(() => {
    if (activeIndex < 0) return;
    document
      .getElementById(`${listId}-option-${activeIndex}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, listId]);

  const move = (delta: number, wrap: boolean) => {
    if (enabled.length === 0) return;
    const current = active ? enabled.indexOf(active) : -1;
    const raw = current + delta;
    const next = wrap
      ? ((raw % enabled.length) + enabled.length) % enabled.length
      : Math.max(0, Math.min(enabled.length - 1, raw));
    setSelection({ value, key: enabled[next].key });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    const extra = onKey?.(e);
    if (extra) {
      e.preventDefault();
      if (extra === "down") move(1, true);
      return;
    }
    const ctrlOnly = e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey;
    if (
      host.platform === "mac" &&
      ctrlOnly &&
      (e.key === "n" || e.key === "p")
    ) {
      e.preventDefault();
      move(e.key === "n" ? 1 : -1, true);
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        move(1, true);
        return;
      case "ArrowUp":
        e.preventDefault();
        move(-1, true);
        return;
      case "PageDown":
        e.preventDefault();
        move(PAGE, false);
        return;
      case "PageUp":
        e.preventDefault();
        move(-PAGE, false);
        return;
      case "Enter":
        e.preventDefault();
        if (active) onAccept(active.key);
        return;
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        onDismiss();
        return;
      case "Tab":
        // The input keeps focus; there is nothing else to tab to.
        e.preventDefault();
        return;
    }
  };

  // Consecutive rows of one group form a section.
  const sections: Array<{
    group?: string;
    items: Array<{ row: QuickPickRow; index: number }>;
  }> = [];
  rows.forEach((row, index) => {
    const last = sections[sections.length - 1];
    if (last && last.group === row.group) last.items.push({ row, index });
    else sections.push({ group: row.group, items: [{ row, index }] });
  });

  const renderOption = (row: QuickPickRow, index: number) => {
    const isActive = index === activeIndex;
    return (
      <div
        key={row.key}
        id={optionId(index)}
        role="option"
        aria-selected={isActive}
        aria-disabled={row.disabled || undefined}
        data-testid={TID.quickPickItem}
        data-active={isActive}
        {...row.attrs}
        className={clsx(
          "group mx-1 flex h-7 min-w-0 cursor-pointer items-center gap-2 rounded px-2 text-[13px]",
          isActive ? "bg-blue-100 text-slate-900" : "text-slate-700",
          row.disabled && "cursor-default text-slate-400"
        )}
        onMouseMove={() => {
          if (!row.disabled && !isActive) setSelection({ value, key: row.key });
        }}
        onClick={() => {
          if (!row.disabled) onAccept(row.key);
        }}
      >
        {row.content}
      </div>
    );
  };

  return (
    <OverlayFrame
      testId={TID.quickPick}
      label={label}
      attrs={{ "data-mode": mode }}
      className="w-[min(40rem,100%)]"
      onDismiss={onDismiss}
    >
      {title && (
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
          {title}
        </div>
      )}
      <div className="p-2">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label={label}
          aria-expanded
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? optionId(activeIndex) : undefined
          }
          autoComplete="off"
          spellCheck={false}
          value={value}
          placeholder={placeholder}
          className="h-8 w-full rounded border border-slate-300 bg-white px-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200"
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>
      <div
        id={listId}
        role="listbox"
        aria-label={label}
        className="max-h-[min(26rem,60vh)] min-h-0 overflow-y-auto pb-1"
        // Keep focus in the input when a row is clicked.
        onMouseDown={(e) => e.preventDefault()}
      >
        {sections.map((section, i) =>
          section.group ? (
            <div
              key={`${section.group}:${i}`}
              role="group"
              aria-labelledby={`${listId}-group-${i}`}
            >
              <div
                id={`${listId}-group-${i}`}
                role="presentation"
                className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500"
              >
                {section.group}
              </div>
              {section.items.map(({ row, index }) => renderOption(row, index))}
            </div>
          ) : (
            <Fragment key={`:${i}`}>
              {section.items.map(({ row, index }) => renderOption(row, index))}
            </Fragment>
          )
        )}
      </div>
      {rows.length === 0 && (
        <div className="px-3 pb-3 pt-1 text-sm text-slate-600">{emptyText}</div>
      )}
      {notice && (
        <div className="border-t border-slate-200 px-3 py-1 text-xs text-slate-600">
          {notice}
        </div>
      )}
    </OverlayFrame>
  );
};

// ── Row content ────────────────────────────────────────────────────────────

const Highlighted: FC<{
  text: string;
  positions: readonly number[];
  offset?: number;
}> = ({ text, positions, offset = 0 }) => (
  <>
    {highlightSegments(text, positions, offset).map((s, i) =>
      s.match ? (
        <mark key={i} className="bg-transparent font-semibold text-blue-700">
          {s.text}
        </mark>
      ) : (
        <Fragment key={i}>{s.text}</Fragment>
      )
    )}
  </>
);

export const DirtyDot: FC = () => (
  <span
    title="Unsaved edits"
    aria-label="unsaved"
    role="img"
    className="h-2 w-2 shrink-0 rounded-full bg-slate-600"
  />
);

export const ChangedDot: FC = () => (
  <span
    title="Changed on disk"
    aria-label="changed on disk"
    role="img"
    className="h-2 w-2 shrink-0 rounded-full bg-amber-500"
  />
);

const FileRowContent: FC<{ row: FileRow; now: number }> = ({ row, now }) => {
  const nameStart = row.folder ? row.folder.length + 1 : 0;
  const Icon = row.path.endsWith(".squiggle") ? SquiggleIcon : FileIcon;
  return (
    <>
      <Icon
        size={14}
        className={clsx(
          "shrink-0",
          row.path.endsWith(".squiggle") ? "text-orange-500" : "text-slate-500"
        )}
      />
      <span className="min-w-0 shrink-0 truncate font-medium">
        <Highlighted
          text={row.name}
          positions={row.positions}
          offset={nameStart}
        />
      </span>
      {row.folder && (
        <span className={clsx("min-w-0 truncate text-xs", DIM)}>
          <Highlighted text={row.folder} positions={row.positions} />
        </span>
      )}
      <span className="ml-auto flex shrink-0 items-center gap-2 pl-2">
        {row.dirty && <DirtyDot />}
        {row.changedAt !== undefined && (
          <span
            data-volatile=""
            className="rounded bg-amber-100 px-1.5 text-[11px] leading-4 text-amber-900"
          >
            changed {formatAgo(row.changedAt, now)}
          </span>
        )}
      </span>
    </>
  );
};

const CommandRowContent: FC<{ row: CommandRow }> = ({ row }) => (
  <>
    <span className="min-w-0 truncate">
      <Highlighted text={row.label} positions={row.positions} />
    </span>
    <span className="ml-auto flex shrink-0 items-center gap-2 pl-4">
      {row.toggle && (
        <span
          data-toggle={row.toggle}
          className={clsx(
            "rounded px-1.5 text-[11px] leading-4",
            row.toggle === "on"
              ? "bg-slate-700 text-white"
              : "bg-slate-100 text-slate-700"
          )}
        >
          {row.toggle}
        </span>
      )}
      {row.keyLabel && (
        <kbd className={clsx("font-sans text-xs tracking-wide", DIM)}>
          {row.keyLabel}
        </kbd>
      )}
    </span>
  </>
);

// ── Quick Open and the command palette ─────────────────────────────────────

const recentCommandsSchema = z.array(z.string());
const NO_RECENT_COMMANDS: string[] = [];
const viewsSchema = z.array(
  z.object({ id: z.string(), label: z.string(), available: z.boolean() })
);

// Re-renders when commands register or the context changes.
function useCommandsVersion(): number {
  const [version, bump] = useReducer((n: number) => n + 1, 0);
  useEffect(() => subscribeCommands(bump), []);
  return version;
}

function currentViews(): ViewEntry[] {
  const parsed = viewsSchema.safeParse(getContext()["squiggle.views"]);
  return parsed.success ? parsed.data : [];
}

type QuickOpenProps = {
  initialValue: string; // "" for files, ">" for commands
  onOpenFile: (path: string) => void;
  onRunCommand: (row: CommandRow) => void;
  onDismiss: () => void;
};

// Quick Open (⌘P) and the palette (⇧⌘P, or `>` typed in Quick Open;
// Backspace on the bare `>` goes back). ⌘P / ⇧⌘P while open switch modes,
// or move the selection down when pressed again in their own mode.
export const QuickOpen: FC<QuickOpenProps> = ({
  initialValue,
  onOpenFile,
  onRunCommand,
  onDismiss,
}) => {
  const workspace = useWorkspaceContext();
  const [value, setValue] = useState(initialValue);
  const mode = value.startsWith(">") ? "commands" : "files";
  const now = useNow(5_000);
  const version = useCommandsVersion();
  const [recentCommands, setRecentCommands] = useGlobalState(
    "palette.recentCommands",
    recentCommandsSchema,
    NO_RECENT_COMMANDS
  );

  const paths = useMemo(() => treeFilePaths(workspace.tree), [workspace.tree]);
  const dirtyPaths = useMemo(
    () =>
      new Set(
        Object.values(workspace.files)
          .filter(isDirty)
          .map((f) => f.path)
      ),
    [workspace.files]
  );

  const files = useMemo(
    () =>
      mode === "files"
        ? quickOpenRows({
            query: value,
            paths,
            mru: workspace.mru,
            activePath: workspace.activePath,
            externalChanges: workspace.externalChanges,
            dirtyPaths,
          })
        : undefined,
    [
      mode,
      value,
      paths,
      workspace.mru,
      workspace.activePath,
      workspace.externalChanges,
      dirtyPaths,
    ]
  );

  const commands = useMemo(
    () =>
      mode === "commands"
        ? paletteRows({
            query: value.slice(1),
            commands: listCommands(),
            views: currentViews(),
            recent: recentCommands,
            platform: host.platform,
            host: host.kind,
          })
        : undefined,
    // `version` covers registrations and context changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, value, recentCommands, version]
  );

  const rows: QuickPickRow[] = files
    ? files.rows.map((row) => ({
        key: row.path,
        group: row.group,
        attrs: {
          "data-path": row.path,
          ...(row.dirty ? { "data-dirty": "1" } : {}),
          ...(row.changedAt !== undefined ? { "data-changed": "1" } : {}),
        },
        content: <FileRowContent row={row} now={now} />,
      }))
    : (commands ?? []).map((row) => ({
        key: row.key,
        group: row.group,
        attrs: { "data-command": row.id },
        content: <CommandRowContent row={row} />,
      }));

  const newFileKey = primaryKeyLabel("explorer.newFile");
  const emptyText = files
    ? files.emptyFolder
      ? `No files. Press ${newFileKey ?? "New File"} to create one`
      : value.trim()
        ? "No matching files"
        : "No other files"
    : "No matching commands";
  const notice = files?.truncated
    ? `Showing first ${TREE_FILE_CAP} files`
    : files && files.hiddenCount > 0
      ? `${files.hiddenCount} more ${files.hiddenCount === 1 ? "match" : "matches"}: type more to narrow down`
      : undefined;

  const accept = (key: string) => {
    if (mode === "files") {
      onOpenFile(key);
      return;
    }
    const row = commands?.find((r) => r.key === key);
    if (!row) return;
    setRecentCommands(pushRecentCommand(recentCommands, row.key));
    onRunCommand(row);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>): KeyResult => {
    if (eventMatchesCommand(e.nativeEvent, "workbench.action.quickOpen")) {
      if (mode === "files") return "down";
      setValue("");
      return "handled";
    }
    if (eventMatchesCommand(e.nativeEvent, "workbench.action.showCommands")) {
      if (mode === "commands") return "down";
      setValue(">");
      return "handled";
    }
    return undefined;
  };

  return (
    <QuickPick
      mode={mode}
      label={mode === "files" ? "Go to file" : "Run a command"}
      value={value}
      placeholder="Search files by name (type > for commands)"
      onValueChange={setValue}
      rows={rows}
      emptyText={emptyText}
      notice={notice}
      onAccept={accept}
      onDismiss={onDismiss}
      onKey={onKey}
    />
  );
};

// ── Generic pickers (showQuickPick) ────────────────────────────────────────

export const PickRequestView: FC<{
  request: QuickPickRequest;
  onDone: (item: QuickPickItem | undefined) => void;
}> = ({ request, onDone }) => {
  const [value, setValue] = useState("");
  const { items, opts } = request;

  const rows: QuickPickRow[] = useMemo(() => {
    const out: QuickPickRow[] = [];
    for (const item of items) {
      const label = fuzzyMatch(value, item.label);
      const description =
        label || !item.description
          ? undefined
          : fuzzyMatch(value, item.description);
      if (!label && !description) continue;
      out.push({
        key: item.id,
        group: item.group,
        disabled: item.disabled,
        attrs: { "data-id": item.id },
        content: (
          <>
            <span className="min-w-0 shrink-0 truncate">
              <Highlighted
                text={item.label}
                positions={label?.positions ?? []}
              />
            </span>
            {item.description && (
              <span
                className={clsx(
                  "min-w-0 truncate text-xs",
                  item.disabled ? "text-slate-400" : DIM
                )}
              >
                <Highlighted
                  text={item.description}
                  positions={description?.positions ?? []}
                />
              </span>
            )}
          </>
        ),
      });
    }
    return out;
  }, [items, value]);

  return (
    <QuickPick
      mode="pick"
      label={opts.title ?? "Pick an item"}
      title={opts.title}
      value={value}
      placeholder={opts.placeholder ?? "Type to filter"}
      onValueChange={setValue}
      rows={rows}
      emptyText={items.length === 0 ? "Nothing to pick" : "No matching items"}
      onAccept={(key) => onDone(items.find((i) => i.id === key))}
      onDismiss={() => onDone(undefined)}
    />
  );
};
