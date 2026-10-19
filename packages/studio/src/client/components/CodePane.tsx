import { clsx } from "clsx";
import {
  FC,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  useState,
} from "react";
import { z } from "zod";

import { CodeEditor, type Simulation } from "@quri/squiggle-components";
import type { SqProject } from "@quri/squiggle-lang";
import { CodeBracketIcon, TextTooltip } from "@quri/ui";

import { readStorage, writeStorage } from "../lib/storage.js";

const stateKey = "squiggle-studio:code-pane";
const stateSchema = z.object({ open: z.boolean(), fraction: z.number() });
type CodePaneState = z.infer<typeof stateSchema>;

const MIN_FRACTION = 0.2;
const MAX_FRACTION = 0.7;
const clampFraction = (f: number) =>
  Math.min(MAX_FRACTION, Math.max(MIN_FRACTION, f));

// Whether the code pane is shown next to Output-style views, and how wide it is
// (as a fraction of the workspace width). Shared by all files.
export function useCodePaneState() {
  const [state, setState] = useState<CodePaneState>(
    () => readStorage(stateKey, stateSchema) ?? { open: true, fraction: 0.42 }
  );
  const update = (patch: Partial<CodePaneState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      writeStorage(stateKey, next);
      return next;
    });
  };
  return [state, update] as const;
}

export const CodeToggle: FC<{ open: boolean; onToggle: () => void }> = ({
  open,
  onToggle,
}) => (
  <TextTooltip text={open ? "Hide code" : "Show code"} placement="bottom">
    <button
      type="button"
      aria-pressed={open}
      aria-label={open ? "Hide code" : "Show code"}
      className={clsx(
        "rounded p-1",
        open
          ? "bg-slate-200 text-slate-900"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      )}
      onClick={onToggle}
    >
      <CodeBracketIcon size={16} />
    </button>
  </TextTooltip>
);

// Code editor on the left, `children` (the active view) on the right. The
// editor shares the workspace's simulation, so the file only runs once.
export const CodePane: FC<{
  editorKey: string;
  code: string;
  setCode: (code: string) => void;
  sourceId: string;
  project: SqProject;
  simulation: Simulation | undefined;
  fraction: number;
  onResize: (fraction: number) => void;
  children: ReactNode;
}> = ({
  editorKey,
  code,
  setCode,
  sourceId,
  project,
  simulation,
  fraction,
  onResize,
  children,
}) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [dragFraction, setDragFraction] = useState<number | undefined>();
  const shown = clampFraction(dragFraction ?? fraction);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!container) return;
    e.preventDefault();
    const rect = container.getBoundingClientRect();
    let latest = shown;
    const onMove = (ev: PointerEvent) => {
      latest = clampFraction((ev.clientX - rect.left) / rect.width);
      setDragFraction(latest);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
      setDragFraction(undefined);
      onResize(latest);
    };
    document.body.style.cursor = "col-resize";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div ref={setContainer} className="flex h-full min-h-0">
      <div
        className="min-w-0 shrink-0 overflow-hidden"
        style={{ width: `${shown * 100}%` }}
      >
        <CodeEditor
          // Uncontrolled: remount when the code is replaced from outside.
          key={editorKey}
          defaultValue={code}
          onChange={setCode}
          sourceId={sourceId}
          project={project}
          simulation={simulation}
          height="100%"
          showGutter
        />
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize code pane"
        className="w-1 shrink-0 cursor-col-resize border-l border-slate-200 bg-white hover:bg-orange-200"
        onPointerDown={onPointerDown}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
};
