import { clsx } from "clsx";
import { FC, useId, useLayoutEffect, useRef, useState } from "react";

import { formatKey } from "../../shared/commands/index.js";
import { TID } from "../../shared/testIds.js";
import {
  cycleIndex,
  initialSwitcherIndex,
  type SwitcherItem,
  switcherItems,
} from "../commands/providers/recent.js";
import { host } from "../lib/host.js";
import { isDirty, useWorkspaceContext } from "../lib/workspaceTypes.js";
import { FileIcon, SquiggleIcon } from "./icons.js";
import { OverlayFrame } from "./OverlayFrame.js";
import { ChangedDot, DirtyDot } from "./QuickPick.js";

// ── Whether Control is held ────────────────────────────────────────────────

// The switcher's command can't tell how it was invoked, so OverlayHost
// installs this tracker: when ⌃` runs the command, Control is down (its own
// keydown came first), and the switcher then cycles while it is held and
// opens on release. From the palette, a menu or an agent it is a plain list.
let controlHeld = false;

export function installControlTracker(): () => void {
  const onKey = (e: KeyboardEvent) => {
    controlHeld = e.ctrlKey;
  };
  const onBlur = () => {
    controlHeld = false;
  };
  window.addEventListener("keydown", onKey, true);
  window.addEventListener("keyup", onKey, true);
  window.addEventListener("blur", onBlur);
  return () => {
    window.removeEventListener("keydown", onKey, true);
    window.removeEventListener("keyup", onKey, true);
    window.removeEventListener("blur", onBlur);
  };
}

export function isControlHeld(): boolean {
  return controlHeld;
}

// ── The switcher ───────────────────────────────────────────────────────────

// A tap (Control released sooner) flips to the previous file without ever
// painting the list.
const REVEAL_MS = 200;

type Props = {
  hold: boolean; // opened with Control held: cycle while held, open on release
  onOpen: (path: string) => void;
  onDismiss: () => void;
};

// The recent-files switcher (§3.10): the MRU, the shown file first and the
// previous one selected. While Control is held, the opening key again moves
// down (⇧ up; in Electron also Tab / ⇧Tab), and releasing Control opens the
// selection; Esc or leaving the window cancels. Opened without Control held
// it is a normal list (↑/↓, Enter).
export const RecentFilesSwitcher: FC<Props> = ({ hold, onOpen, onDismiss }) => {
  const workspace = useWorkspaceContext();
  const listId = useId();
  const [items] = useState<SwitcherItem[]>(() =>
    switcherItems({
      mru: workspace.mru,
      activePath: workspace.activePath,
      externalChanges: workspace.externalChanges,
      dirtyPaths: new Set(
        Object.values(workspace.files)
          .filter(isDirty)
          .map((f) => f.path)
      ),
    })
  );
  const [index, setIndex] = useState(() => initialSwitcherIndex(items));
  const [revealed, setRevealed] = useState(!hold);
  const indexRef = useRef(index);
  indexRef.current = index;
  const listRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);
  const callbacks = useRef({ onOpen, onDismiss });
  callbacks.current = { onOpen, onDismiss };

  const openAt = (i: number) => {
    if (doneRef.current) return;
    doneRef.current = true;
    const item = items[i];
    if (!item || item.shown) callbacks.current.onDismiss();
    else callbacks.current.onOpen(item.path);
  };
  const cancel = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    callbacks.current.onDismiss();
  };
  const openRef = useRef(openAt);
  openRef.current = openAt;
  const cancelRef = useRef(cancel);
  cancelRef.current = cancel;

  useLayoutEffect(() => {
    // Control was released before the switcher mounted: a tap.
    if (hold && !isControlHeld()) {
      openRef.current(indexRef.current);
      return;
    }
    listRef.current?.focus();
    const timer = hold
      ? setTimeout(() => setRevealed(true), REVEAL_MS)
      : undefined;
    const move = (delta: number) => {
      setRevealed(true);
      setIndex((i) => cycleIndex(i, delta, items.length));
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing) return;
      const cycle =
        e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        (e.code === "Backquote" ||
          (host.kind === "electron" && e.key === "Tab"));
      const handled = (fn: () => void) => {
        e.preventDefault();
        e.stopPropagation();
        fn();
      };
      if (cycle) return handled(() => move(e.shiftKey ? -1 : 1));
      switch (e.key) {
        case "ArrowDown":
          return handled(() => move(1));
        case "ArrowUp":
          return handled(() => move(-1));
        case "Home":
          return handled(() => setIndex(0));
        case "End":
          return handled(() => setIndex(items.length - 1));
        case "Enter":
          return handled(() => openRef.current(indexRef.current));
        case "Escape":
          return handled(() => cancelRef.current());
        case "Tab":
          return handled(() => undefined);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (hold && e.key === "Control") openRef.current(indexRef.current);
    };
    const onBlur = () => cancelRef.current();
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("blur", onBlur);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("blur", onBlur);
    };
    // Installed once: the list is a snapshot taken when the switcher opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    document
      .getElementById(`${listId}-option-${index}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [index, listId]);

  const ctrl = host.platform === "mac" ? "⌃" : "Ctrl";
  const downKey = formatKey("ctrl+`", host.platform);
  const upKey = formatKey("ctrl+shift+`", host.platform);

  return (
    <OverlayFrame
      testId={TID.recentFilesSwitcher}
      label="Recent files"
      attrs={{ "data-hold": hold ? "1" : "0" }}
      className="w-[min(28rem,100%)]"
      invisible={!revealed}
      onDismiss={cancel}
    >
      <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
        Recent files
      </div>
      <div
        ref={listRef}
        id={listId}
        role="listbox"
        tabIndex={-1}
        aria-label="Recent files"
        aria-activedescendant={`${listId}-option-${index}`}
        className="max-h-[min(24rem,60vh)] min-h-0 overflow-y-auto py-1 focus:outline-none"
        onMouseDown={(e) => e.preventDefault()}
      >
        {items.map((item, i) => {
          const active = i === index;
          const Icon = item.path.endsWith(".squiggle")
            ? SquiggleIcon
            : FileIcon;
          return (
            <div
              key={item.path}
              id={`${listId}-option-${i}`}
              role="option"
              aria-selected={active}
              data-path={item.path}
              data-active={active}
              data-shown={item.shown ? "1" : undefined}
              className={clsx(
                "group mx-1 flex h-7 cursor-pointer items-center gap-2 rounded px-2 text-[13px]",
                active ? "bg-blue-100 text-slate-900" : "text-slate-700"
              )}
              onMouseMove={() => {
                if (!active) setIndex(i);
              }}
              onClick={() => openAt(i)}
            >
              <Icon
                size={14}
                className={clsx(
                  "shrink-0",
                  item.path.endsWith(".squiggle")
                    ? "text-orange-500"
                    : "text-slate-500"
                )}
              />
              <span className="min-w-0 shrink-0 truncate font-medium">
                {item.name}
              </span>
              {item.folder && (
                <span className="min-w-0 truncate text-xs text-slate-500 group-data-[active=true]:text-slate-600">
                  {item.folder}
                </span>
              )}
              <span className="ml-auto flex shrink-0 items-center gap-2 pl-2">
                {item.dirty && <DirtyDot />}
                {item.changed && <ChangedDot />}
                {item.shown && (
                  <span className="text-[11px] text-slate-500 group-data-[active=true]:text-slate-600">
                    shown
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
      <div className="border-t border-slate-200 px-3 py-1 text-xs text-slate-600">
        {hold
          ? `Hold ${ctrl}: ${downKey} moves down, ${upKey} up; release to open`
          : "↑↓ to move, ↵ to open, Esc to close"}
      </div>
    </OverlayFrame>
  );
};
