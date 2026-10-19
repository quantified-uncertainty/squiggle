import { clsx } from "clsx";
import {
  FC,
  KeyboardEvent,
  ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { RefreshIcon, TextTooltip } from "@quri/ui";

import { TID } from "../../shared/testIds.js";
import { useFocuser } from "../commands/focus.js";
import { runCommand, useCommandState } from "../commands/registry.js";
import {
  BANNER_SAVE_STATES,
  changesStatus,
  connectionStatus,
  cursorText,
  followStatus,
  problemsStatus,
  runAnnouncement,
  type RunState,
  runStatus,
  saveStatus,
  type Tone,
} from "../lib/statusFormat.js";
import { useActiveRun } from "../lib/stores/activeRun.js";
import { useCursor } from "../lib/stores/cursor.js";
import { useSetting } from "../lib/studioState.js";
import { isDirty, useWorkspaceContext } from "../lib/workspaceTypes.js";
import { EyeIcon } from "./icons.js";
import { primaryKeyLabel } from "./Kbd.js";

// Every color here is at least 4.5:1 on the bar's slate-50 (§3.11, #59).
const TONES: Record<Tone, string> = {
  normal: "",
  muted: "text-slate-500 enabled:hover:text-slate-700",
  warning: "text-amber-700",
  error: "text-red-700",
  active: "bg-orange-50 text-orange-700",
};

type ItemProps = {
  id: string; // data-status-item
  state: string; // data-state
  title: string; // tooltip
  tone: Tone;
  command?: string; // runs on click (disabled while the command is)
  onClick?: () => void; // instead of running `command`
  alwaysEnabled?: boolean; // with onClick: clickable whatever `command` says
  pressed?: boolean; // toggle items (Follow): aria-pressed
  attrs?: Record<`data-${string}`, string>;
  className?: string;
  children: ReactNode;
};

const Item: FC<ItemProps> = ({
  id,
  state,
  title,
  tone,
  command,
  onClick,
  alwaysEnabled = false,
  pressed,
  attrs,
  className,
  children,
}) => {
  const commandState = useCommandState(command ?? "");
  const enabled = alwaysEnabled || commandState.enabled;
  return (
    <TextTooltip text={title} placement="top">
      <button
        type="button"
        data-testid={TID.statusbarItem}
        data-status-item={id}
        data-state={state}
        data-command={command}
        {...attrs}
        aria-pressed={pressed}
        disabled={!enabled}
        className={clsx(
          "flex h-full shrink-0 items-center gap-1.5 whitespace-nowrap px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-300 enabled:hover:bg-slate-200/70 disabled:cursor-default",
          TONES[tone],
          className
        )}
        onClick={() => {
          if (onClick) onClick();
          else if (command) runCommand(command, undefined, "button");
        }}
      >
        {children}
      </button>
    </TextTooltip>
  );
};

// ⓧ, for problems and failed runs.
const ErrorMark: FC = () => (
  <svg width={12} height={12} viewBox="0 0 16 16" fill="none" aria-hidden>
    <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="m5.75 5.75 4.5 4.5m0-4.5-4.5 4.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const Spinner: FC = () => (
  <span
    aria-hidden
    className="h-2.5 w-2.5 animate-spin rounded-full border-[1.5px] border-slate-500 border-t-transparent"
  />
);

// Focuses the first button of the conflict / deleted banner, or of the root
// banner when the folder was switched.
function focusBanner(rootBanner: boolean) {
  const selector = `[data-testid="${rootBanner ? TID.rootBanner : TID.fileBanner}"] button`;
  document.querySelector<HTMLButtonElement>(selector)?.focus();
}

// Announces only the transitions to an error and back to ok (§3.8).
function useRunAnnouncement(
  run: { state: RunState; text: string; title: string } | undefined
): string {
  const previous = useRef<RunState | undefined>(undefined);
  const [message, setMessage] = useState("");
  useLayoutEffect(() => {
    if (!run) {
      previous.current = undefined;
      return;
    }
    const next = runAnnouncement(previous.current, {
      ...run,
      tone: "normal",
    });
    if (next !== undefined) setMessage(next);
    previous.current = run.state;
  }, [run?.state, run?.text, run?.title]); // eslint-disable-line react-hooks/exhaustive-deps
  return message;
}

// The 24 px status bar (§3.8): connection, Follow, changes on disk and
// problems on the left; cursor, run and save state of the shown file on the
// right. Each item is a button that runs a registry command, carries
// data-testid="statusbar-item" data-status-item data-state, and has a
// tooltip above. It is a focus region: F6 reaches it, ←/→ move between items.
export const StatusBar: FC = () => {
  const workspace = useWorkspaceContext();
  const follow = useSetting("squiggle.followChanges");
  const autoSave = useSetting("files.autoSave");
  const activeRun = useActiveRun();
  const cursor = useCursor();
  const footerRef = useRef<HTMLElement>(null);

  const active = workspace.activePath;
  const isSquiggle = active?.endsWith(".squiggle") ?? false;
  const run =
    active && isSquiggle && activeRun?.path === active ? activeRun : undefined;

  const connection = connectionStatus(
    workspace.connection,
    workspace.rootMissing
  );
  const followItem = followStatus(
    follow,
    primaryKeyLabel("squiggle.toggleFollowChanges")
  );
  const changes = changesStatus(
    workspace.externalChanges,
    workspace.followNotice,
    primaryKeyLabel("squiggle.nextChange")
  );
  const problems = run ? problemsStatus(run.errors) : undefined;
  const runItem = run
    ? runStatus(run, primaryKeyLabel("squiggle.run"))
    : undefined;
  const announcement = useRunAnnouncement(runItem);
  const saveState = active ? workspace.saveState(active) : undefined;
  const otherDirty = Object.values(workspace.files).filter(
    (f) => f.path !== active && isDirty(f)
  ).length;
  const save = saveState
    ? saveStatus(saveState, {
        autoSave,
        otherDirty,
        saveKey: primaryKeyLabel("workbench.action.files.save"),
      })
    : undefined;
  const showCursor = cursor && cursor.path === active;

  const focusFirst = useCallback((): boolean => {
    const first = footerRef.current?.querySelector<HTMLButtonElement>(
      "button:not([disabled])"
    );
    if (!first) return false;
    first.focus();
    return true;
  }, []);
  useFocuser("statusbar", focusFirst);

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    const buttons = [
      ...(footerRef.current?.querySelectorAll<HTMLButtonElement>(
        "button:not([disabled])"
      ) ?? []),
    ];
    if (buttons.length === 0) return;
    e.preventDefault();
    const current = buttons.indexOf(
      document.activeElement as HTMLButtonElement
    );
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? buttons.length - 1
          : (current + (e.key === "ArrowRight" ? 1 : -1) + buttons.length) %
            buttons.length;
    buttons[next]?.focus();
  };

  return (
    <footer
      ref={footerRef}
      role="contentinfo"
      aria-label="Status bar"
      data-testid={TID.statusbar}
      data-studio-region="statusbar"
      className="flex h-6 shrink-0 items-center justify-between gap-2 overflow-hidden border-t border-slate-200 bg-slate-50 px-1 text-[11px] text-slate-600"
      onKeyDown={onKeyDown}
    >
      <div className="flex h-full min-w-0 items-center">
        <Item
          id="connection"
          state={connection.state}
          title={connection.title}
          tone={connection.tone}
          command="squiggle.refreshTree"
        >
          <span
            aria-hidden
            className={clsx(
              "h-2 w-2 shrink-0 rounded-full",
              connection.state === "live" && "bg-emerald-500",
              connection.state === "reconnecting" &&
                "animate-pulse bg-amber-500",
              connection.state === "resyncing" && "bg-amber-500",
              connection.state === "root-missing" && "bg-red-600"
            )}
          />
          {connection.text}
        </Item>
        <Item
          id="follow"
          state={followItem.state}
          title={followItem.title}
          tone={followItem.tone}
          command="squiggle.toggleFollowChanges"
          pressed={follow}
        >
          <EyeIcon size={12} />
          {followItem.text}
        </Item>
        {changes && (
          <Item
            id="changes"
            state={changes.state}
            title={changes.title}
            tone={changes.tone}
            command="squiggle.nextChange"
            attrs={{ "data-count": String(changes.count) }}
            className="min-w-0"
          >
            <RefreshIcon size={12} className="shrink-0" />
            <span className="min-w-0 truncate">{changes.text}</span>
          </Item>
        )}
        {problems && (
          <Item
            id="problems"
            state={problems.state}
            title={problems.title}
            tone={problems.tone}
            command="squiggle.showFirstProblem"
            attrs={{ "data-count": String(problems.count) }}
          >
            {problems.count > 0 && <ErrorMark />}
            {problems.text}
          </Item>
        )}
      </div>
      <div className="flex h-full shrink-0 items-center">
        {showCursor && (
          <span
            data-testid={TID.statusbarItem}
            data-status-item="cursor"
            data-state={cursor.selected > 0 ? "selection" : "cursor"}
            data-line={cursor.line}
            data-column={cursor.column}
            className="flex h-full items-center whitespace-nowrap px-2 max-[720px]:hidden"
          >
            {cursorText(cursor)}
          </span>
        )}
        {runItem && (
          <Item
            id="run"
            state={runItem.state}
            title={runItem.title}
            tone={runItem.tone}
            command="squiggle.run"
            attrs={{
              ...(runItem.ms !== undefined
                ? { "data-ms": String(runItem.ms), "data-volatile": "" }
                : {}),
            }}
          >
            {runItem.state === "running" && <Spinner />}
            {runItem.state === "error" && <ErrorMark />}
            {runItem.text}
          </Item>
        )}
        {save && saveState && (
          <Item
            id="save"
            state={save.state}
            title={save.title}
            tone={save.tone}
            command="workbench.action.files.save"
            {...(BANNER_SAVE_STATES.has(saveState)
              ? {
                  onClick: () => focusBanner(saveState === "blocked"),
                  alwaysEnabled: true,
                }
              : {})}
          >
            {save.text}
          </Item>
        )}
        <span aria-live="polite" className="sr-only">
          {announcement}
        </span>
      </div>
    </footer>
  );
};
