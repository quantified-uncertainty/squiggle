import {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { z } from "zod";

import {
  type CodeEditorHandle,
  type EditorCursorDetail,
  type Simulation,
  SQ_EDITOR_CURSOR_EVENT,
} from "@quri/squiggle-components";
import {
  type SqError,
  type SqLinker,
  type SqLocation,
  SqProject,
  type SqValuePath,
} from "@quri/squiggle-lang";
import { RefreshIcon } from "@quri/ui";

import { TID } from "../../shared/testIds.js";
import type { ViewState } from "../../shared/viewState.js";
import { useContextKeys } from "../commands/context.js";
import { focusMain, focusRegion, getFocusRegion } from "../commands/focus.js";
import { runCommand, useCommand } from "../commands/registry.js";
import { pruneEditorStates } from "../lib/editorStateCache.js";
import { useHtmlState, useReportBusy } from "../lib/idle.js";
import { makeStudioLinker } from "../lib/linker.js";
import { updateViewState } from "../lib/navigation.js";
import { type ActiveRun, publishActiveRun } from "../lib/stores/activeRun.js";
import { publishCursor } from "../lib/stores/cursor.js";
import { useLayout } from "../lib/stores/layout.js";
import { useSetting } from "../lib/studioState.js";
import type { OpenFile, Workspace } from "../lib/workspaceTypes.js";
import { type OutputLayout, OutputLayoutContext } from "../views/OutputView.js";
import type {
  StudioRunOutput,
  StudioView,
  StudioViewContext,
} from "../views/types.js";
import { CodePane, NARROW_EDITOR_AREA_PX } from "./CodePane.js";
import { EditorHeader } from "./EditorHeader.js";
import { RunHost } from "./RunHost.js";
import { TextFileWorkspace } from "./TextFileWorkspace.js";
import type { ViewEntry } from "./ViewSwitcher.js";

export type FileWorkspaceProps = {
  file: OpenFile;
  workspace: Workspace;
  views: readonly StudioView[];
  embed: boolean;
  initial?: ViewState; // URL initial state for this file (authoritative in embed)
  banner?: ReactNode; // FileBanner, rendered under the editor header
};

// The shown file (§3.6): the editor header, the banner, then the code pane and
// the active view for .squiggle files, or the text editor for .json / .md.
// App keys it by path, so every file gets its own workspace.

const Shell: FC<{
  header: ReactNode;
  banner?: ReactNode;
  children: ReactNode;
}> = ({ header, banner, children }) => (
  <div className="flex h-full min-h-0 flex-col">
    {header}
    {banner}
    <div className="min-h-0 flex-1">{children}</div>
  </div>
);

const viewSelectArgs = z.union([
  z.object({ id: z.string().min(1) }),
  z.object({ index: z.number().int().min(1).max(9) }),
]);
const setLayoutArgs = z.object({ layout: z.enum(["cards", "list"]) });

// The error's location in this file: its own, or for an error in an import,
// the import statement that led to it.
function locationInFile(error: SqError, path: string): SqLocation | undefined {
  const location = error.tag === "other" ? undefined : error.location();
  return location?.source === path ? location : undefined;
}

// ActiveRun's errors (the status bar, Copy for Agent, agents): the innermost
// error of an import chain, located at its own code or the import statement.
function runErrors(output: StudioRunOutput["output"]): ActiveRun["errors"] {
  const result = output.result;
  if (result.ok) return [];
  return result.value.errors.map((error) => {
    const inner = error.tag === "import" ? error.wrappedError() : error;
    const own = inner.tag === "other" ? undefined : inner.location();
    const location =
      own ?? (error.tag === "import" ? error.location() : undefined);
    return {
      kind: inner.tag,
      message: inner.toString(),
      ...(location
        ? {
            location: {
              source: location.source,
              line: location.start.line,
              column: location.start.column,
            },
          }
        : {}),
    };
  });
}

// A project for each `runEpoch` (#10), with a linker that records the source of
// every module it loads (ActiveRun.sources, for the agent serializers).
function makeRunProject(linker: SqLinker) {
  const sources = new Map<string, string>();
  const recording: SqLinker = {
    resolve: linker.resolve,
    loadModule: async (sourceId, hash) => {
      const module = await linker.loadModule(sourceId, hash);
      sources.set(sourceId, module.code);
      return module;
    },
  };
  return { project: new SqProject({ linker: recording }), sources };
}

const SquiggleFileWorkspace: FC<FileWorkspaceProps> = ({
  file,
  workspace,
  views,
  embed,
  initial,
  banner,
}) => {
  const path = file.path;
  const autorun = useSetting("squiggle.autorun");
  const { recordDependency, selectView, setBuffer } = workspace;

  // One linker for the views (relative values, the Playground); each run
  // project wraps it.
  const [linker] = useState(() =>
    makeStudioLinker((dep) => recordDependency(path, dep))
  );
  const run = useMemo(
    () => makeRunProject(linker),
    // A new project when an import's content changed on disk.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [linker, file.runEpoch]
  );

  // The latest run. A new RunHost keeps showing the previous run (stale)
  // until its first run finishes; execution ids only grow.
  const [runOutput, setRunOutput] = useState<StudioRunOutput | undefined>();
  const onRun = useCallback(
    (simulation: Simulation | undefined) =>
      setRunOutput((prev) => {
        if (!simulation) {
          return prev && !prev.isStale ? { ...prev, isStale: true } : prev;
        }
        const newRun = prev?.simulation.output !== simulation.output;
        return {
          sourceId: path,
          output: simulation.output,
          project: simulation.project,
          isStale: simulation.isStale,
          executionId: newRun
            ? (prev?.executionId ?? 0) + 1
            : (prev?.executionId ?? 1),
          simulation,
        };
      }),
    [path]
  );
  const runNowRef = useRef<(() => void) | undefined>(undefined);

  // ── Views ──────────────────────────────────────────────────────────────
  const viewId = embed
    ? (initial?.view ?? "output")
    : (workspace.viewIds[path] ?? initial?.view);
  const availableIds = views
    .filter((v) => v.isAvailable({ filePath: path, runOutput }))
    .map((v) => v.id);
  const availableViews = views.filter((v) => availableIds.includes(v.id));
  // In embed mode (`render`) the requested view is authoritative: no fallback.
  const activeView = embed
    ? availableViews.find((v) => v.id === viewId)
    : (availableViews.find((v) => v.id === viewId) ??
      // Without a choice, files with a relative values spec open on their
      // dashboard.
      (viewId === undefined
        ? availableViews.find((v) => v.id === "relative-values")
        : undefined) ??
      availableViews[0]);
  const viewEntriesKey = views
    .map((v) => `${v.id}:${v.label}:${availableIds.includes(v.id)}`)
    .join("|");
  const viewEntries: ViewEntry[] = useMemo(
    () =>
      views.map((v) => ({
        id: v.id,
        label: v.label,
        available: availableIds.includes(v.id),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viewEntriesKey]
  );

  // ── Code pane ──────────────────────────────────────────────────────────
  const [codePane, setCodePane] = useLayout("codePane");
  // The URL's `code`, or closed when the editor area starts narrow (#21);
  // the user's toggle replaces it.
  const [codeOverride, setCodeOverride] = useState<boolean | undefined>(
    embed ? undefined : initial?.code
  );
  const canShowCode = activeView !== undefined && !activeView.hasOwnEditor;
  const codeOpen = codeOverride ?? codePane.open;
  const codeVisible = canShowCode && codeOpen;
  const codePaneRef = useRef({ value: codePane, set: setCodePane });
  codePaneRef.current = { value: codePane, set: setCodePane };
  // Stable (the store's setter isn't), so the views' viewer actions are too.
  const setCodeOpen = useCallback((open: boolean) => {
    setCodeOverride(undefined);
    codePaneRef.current.set({ ...codePaneRef.current.value, open });
  }, []);
  const editorRef = useRef<CodeEditorHandle | null>(null);
  const codeVisibleRef = useRef(codeVisible);
  codeVisibleRef.current = codeVisible;

  // Shows `location` in the code pane; `focus` (the `e` key on a value, a
  // problem) also opens the pane and focuses the editor. Locations in other
  // files (imports) are P1.
  const canShowCodeRef = useRef(canShowCode);
  canShowCodeRef.current = canShowCode;
  const revealInCode = useCallback(
    (location: SqLocation, focus: boolean) => {
      if (location.source !== path || !canShowCodeRef.current) return;
      const show = () => editorRef.current?.scrollTo(location, focus);
      if (codeVisibleRef.current) {
        show();
        return;
      }
      if (!focus) return;
      setCodeOpen(true);
      // Once the pane is laid out again.
      requestAnimationFrame(() => requestAnimationFrame(show));
    },
    [path, setCodeOpen]
  );

  // ── Output layout ──────────────────────────────────────────────────────
  const [globalLayout, setGlobalLayout] = useLayout("outputLayout");
  const [layoutOverride, setLayoutOverride] = useState<
    OutputLayout | undefined
  >(embed ? undefined : initial?.layout);
  const outputLayout: OutputLayout = embed
    ? (initial?.layout ?? "cards")
    : (layoutOverride ?? globalLayout);

  // ── Reveal in Output (⇧⌥V, gutter markers) ───────────────────────────
  const revealRef = useRef<((path: SqValuePath) => void) | undefined>(
    undefined
  );
  const registerReveal = useCallback((fn: (p: SqValuePath) => void) => {
    revealRef.current = fn;
    return () => {
      if (revealRef.current === fn) revealRef.current = undefined;
    };
  }, []);
  const revealInOutput = useCallback((valuePath: SqValuePath) => {
    revealRef.current?.(valuePath);
  }, []);

  const setCode = useCallback(
    (code: string) => setBuffer(path, code),
    [setBuffer, path]
  );
  const context: StudioViewContext = {
    filePath: path,
    code: file.buffer,
    runOutput,
    linker,
    editorKey: `${path}:${file.editorEpoch}:${file.externalRevision}`,
    setCode,
    openFile: (p) => workspace.openFile(p, { reason: "link" }),
    embed,
    initial,
    variable: embed ? initial?.variable : undefined,
    revealInCode,
    registerReveal,
  };

  // ── Run state: busy, <html>, the active-run store ──────────────────────
  const runStatus: ActiveRun["status"] =
    !runOutput || runOutput.isStale
      ? "running"
      : !autorun && runOutput.output.module.code !== file.buffer
        ? "not-run"
        : runOutput.output.result.ok
          ? "ok"
          : "error";
  useReportBusy(`run:${path}`, runStatus === "running");
  const errors = useMemo(
    () => (runOutput ? runErrors(runOutput.output) : []),
    [runOutput]
  );
  const activeRun: ActiveRun = useMemo(
    () => ({
      path,
      status: runStatus,
      ms: runOutput?.output.executionTime,
      executionId: runOutput?.executionId ?? 0,
      errors,
      output: runOutput?.output,
      sources: runOutput
        ? new Map([...run.sources, [path, runOutput.output.module.code]])
        : undefined,
    }),
    [path, runStatus, runOutput, errors, run]
  );
  useEffect(() => publishActiveRun(activeRun), [activeRun]);
  useEffect(() => () => publishActiveRun(undefined), []);
  useHtmlState({
    view: activeView?.id,
    run:
      runStatus === "not-run"
        ? "none"
        : runStatus === "running"
          ? "running"
          : runStatus,
    "execution-id": runOutput ? String(runOutput.executionId) : undefined,
  });

  useContextKeys({
    "squiggle.view": activeView?.id,
    "squiggle.viewCount": availableViews.length,
    "squiggle.views": viewEntries,
    "squiggle.codePaneVisible": codeVisible,
    "squiggle.viewHasOwnEditor": activeView?.hasOwnEditor ?? false,
    "squiggle.outputLayout": outputLayout,
  });

  // The address bar mirrors the shown view and its in-file state (§2.4).
  useEffect(() => {
    if (embed || !activeView) return;
    updateViewState({
      view: activeView.id,
      layout: activeView.id === "output" ? outputLayout : undefined,
      code: canShowCode ? codeVisible : undefined,
    });
  }, [embed, activeView, outputLayout, canShowCode, codeVisible]);

  // Editor states of files that left the working set are dropped (#41).
  const workingSetKey = Object.keys(workspace.files).join("\0");
  useEffect(() => {
    pruneEditorStates(workingSetKey.split("\0"));
  }, [workingSetKey]);

  // ── Commands ───────────────────────────────────────────────────────────
  const selectViewById = (id: string) => {
    if (!availableIds.includes(id)) return false;
    selectView(path, id);
    return true;
  };
  useCommand("squiggle.view.select", (args) => {
    const parsed = viewSelectArgs.safeParse(args);
    if (!parsed.success) return false;
    const id =
      "id" in parsed.data
        ? parsed.data.id
        : viewEntries[parsed.data.index - 1]?.id;
    return id === undefined ? false : selectViewById(id);
  });

  useCommand("squiggle.toggleCodePane", () => {
    const hadFocus = getFocusRegion() === "editor";
    setCodeOpen(!codeVisible);
    if (codeVisible && hadFocus) void focusRegion("view");
  });

  useCommand("squiggle.run", () => runNowRef.current?.());

  useCommand("squiggle.output.setLayout", (args) => {
    const parsed = setLayoutArgs.safeParse(args);
    if (!parsed.success) return false;
    setLayoutOverride(undefined);
    setGlobalLayout(parsed.data.layout);
  });

  // From the menu or the palette: the value at the code editor's cursor.
  useCommand("squiggle.revealInOutput", () => {
    const selection = editorRef.current?.getSelection();
    if (!selection || !runOutput) return false;
    const found = runOutput.output.findValuePathByOffset(selection.to);
    if (!found.ok) return false;
    revealInOutput(found.value);
  });

  // The status bar's problems item: the code pane, with the first error
  // selected.
  useCommand("squiggle.showFirstProblem", () => {
    const result = runOutput?.output.result;
    if (!result || result.ok) return false;
    const location = result.value.errors
      .map((e) => locationInFile(e, path))
      .find((l) => l !== undefined);
    if (activeView?.hasOwnEditor) selectViewById("output");
    setCodeOpen(true);
    const select = () => {
      if (location) editorRef.current?.scrollTo(location, true);
      else editorRef.current?.focus();
    };
    requestAnimationFrame(() => requestAnimationFrame(select));
  });

  useCommand("workbench.action.focusFirstEditorGroup", () => {
    if (activeView?.hasOwnEditor) {
      void focusRegion("view");
      return;
    }
    if (!codeVisible) setCodeOpen(true);
    void focusRegion("editor", { retryMs: 500 });
  });
  useCommand("workbench.action.focusSecondEditorGroup", () => {
    void focusRegion("view").then((ok) => {
      if (!ok) void focusMain();
    });
  });

  // ── Cursor (status bar) ────────────────────────────────────────────────
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onCursor = (e: Event) => {
      const detail = (e as CustomEvent<EditorCursorDetail>).detail;
      publishCursor({ path, ...detail });
    };
    root.addEventListener(SQ_EDITOR_CURSOR_EVENT, onCursor);
    return () => {
      root.removeEventListener(SQ_EDITOR_CURSOR_EVENT, onCursor);
      publishCursor(undefined);
    };
  }, [path, embed]);

  const viewPanelId = useId();
  const runHost = (
    <RunHost
      key={file.runEpoch}
      path={path}
      code={file.buffer}
      project={run.project}
      autorun={autorun}
      onRun={onRun}
      runRef={runNowRef}
    />
  );

  // In embed mode (`render`) the requested view is authoritative; an
  // unavailable one is an error once the run says so (#47).
  const viewBody = activeView ? (
    activeView.render(context)
  ) : runStatus === "running" ? (
    <div className="grid h-full place-items-center" data-studio-ready="0">
      <RefreshIcon className="animate-spin text-slate-400" size={20} />
    </div>
  ) : (
    <div
      className="p-6 text-sm text-red-700"
      data-testid={TID.outputError}
      data-studio-error=""
    >
      {views.some((v) => v.id === viewId)
        ? `The view "${viewId}" isn't available for ${path}.`
        : `Unknown view "${viewId}".`}
    </div>
  );

  if (embed) {
    return (
      <div ref={rootRef}>
        {runHost}
        <OutputLayoutContext.Provider value={outputLayout}>
          {viewBody}
        </OutputLayoutContext.Provider>
      </div>
    );
  }

  return (
    <OutputLayoutContext.Provider value={outputLayout}>
      <div ref={rootRef} className="flex h-full min-h-0 flex-col">
        {runHost}
        <EditorHeader
          file={file}
          views={{
            entries: viewEntries,
            activeId: activeView?.id,
            panelId: viewPanelId,
          }}
          toolbar={activeView?.renderToolbar?.(context)}
          codePane={{
            visible: codeVisible,
            ownEditor: activeView?.hasOwnEditor ? activeView.label : undefined,
          }}
        />
        {banner}
        <div className="min-h-0 flex-1">
          <CodePane
            file={file}
            open={codeVisible}
            mountEditor={canShowCode}
            fraction={codePane.fraction}
            onResize={(fraction) => setCodePane({ ...codePane, fraction })}
            onFirstLayout={(width) => {
              if (width < NARROW_EDITOR_AREA_PX && codeOverride === undefined) {
                setCodeOverride(false);
              }
            }}
            editorRef={editorRef}
            setCode={setCode}
            // ⌘↵ in the editor: CodeMirror's onSubmit (§5.2), logged as a key.
            onSubmit={() => runCommand("squiggle.run", undefined, "key")}
            onFocusByPath={revealInOutput}
            project={runOutput?.project ?? run.project}
            simulation={runOutput?.simulation}
            viewPanel={{ id: viewPanelId, label: activeView?.label ?? "View" }}
          >
            {viewBody}
          </CodePane>
        </div>
      </div>
    </OutputLayoutContext.Provider>
  );
};

export const FileWorkspace: FC<FileWorkspaceProps> = (props) => {
  const { file, embed, banner } = props;
  if (file.status === "loading") {
    return (
      <Shell
        banner={banner}
        header={embed ? null : <EditorHeader file={file} />}
      >
        <div className="grid h-full place-items-center" data-studio-ready="0">
          <RefreshIcon className="animate-spin text-slate-400" size={20} />
        </div>
      </Shell>
    );
  }
  if (file.status === "error") {
    return (
      <Shell
        banner={banner}
        header={embed ? null : <EditorHeader file={file} />}
      >
        {/* Ready and failed: render and agents stop waiting (#25). */}
        <div
          className="p-6 text-sm text-red-700"
          data-testid={TID.outputError}
          data-studio-ready="1"
          data-studio-error=""
        >
          Couldn&apos;t open {file.path}: {file.error}
        </div>
      </Shell>
    );
  }
  if (!file.path.endsWith(".squiggle")) {
    return (
      <TextFileWorkspace
        key={file.path}
        file={file}
        workspace={props.workspace}
        banner={banner}
        embed={embed}
      />
    );
  }
  // Not keyed by runEpoch: an import change replaces only RunHost's project
  // (#10).
  return <SquiggleFileWorkspace {...props} />;
};
