import { clsx } from "clsx";
import {
  FC,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  CodeEditor,
  type CodeEditorHandle,
  type Simulation,
} from "@quri/squiggle-components";
import type { SqProject, SqValuePath } from "@quri/squiggle-lang";

import { TID } from "../../shared/testIds.js";
import { useFocuser } from "../commands/focus.js";
import { loadEditorState, saveEditorState } from "../lib/editorStateCache.js";
import type { OpenFile } from "../lib/workspaceTypes.js";

// Code pane width, as a fraction of the editor area, and the view's minimum
// width in pixels (#21): the view keeps at least 360 px however the pane is
// dragged, and the pane starts closed in an editor area under 760 px. An area
// too narrow for both a 240 px editor and a 360 px view beside it stacks
// them instead: the code on top, the view below, both full width.
export const MIN_FRACTION = 0.2;
export const MAX_FRACTION = 0.7;
export const MIN_VIEW_PX = 360;
export const MIN_CODE_PX = 240;
export const NARROW_EDITOR_AREA_PX = 760;
const SEPARATOR_PX = 4; // the resize handle (w-1 / h-1)
export const STACK_BELOW_PX = MIN_CODE_PX + SEPARATOR_PX + MIN_VIEW_PX;

export const clampFraction = (f: number) =>
  Math.min(MAX_FRACTION, Math.max(MIN_FRACTION, f));

// Whether an editor area `width` px wide stacks the code above the view.
export const isStacked = (width: number) => width < STACK_BELOW_PX;

// The editor column's width in pixels for a container `width` px wide (side
// by side): at least 240 px, and the view keeps at least 360 px.
export function codePaneWidth(fraction: number, width: number): number {
  return Math.max(
    MIN_CODE_PX,
    Math.min(
      clampFraction(fraction) * width,
      width - SEPARATOR_PX - MIN_VIEW_PX
    )
  );
}

type Props = {
  file: OpenFile;
  open: boolean; // the editor column is shown
  // Mount the editor (false while the view has its own editor: the
  // Playground edits the buffer meanwhile, so the editor remounts from it).
  mountEditor: boolean;
  fraction: number;
  onResize: (fraction: number) => void;
  // The container's width when it is first laid out (the narrow-start rule).
  onFirstLayout?: (width: number) => void;
  editorRef: RefObject<CodeEditorHandle | null>;
  setCode: (code: string) => void;
  onSubmit: () => void;
  onFocusByPath: (path: SqValuePath) => void;
  project: SqProject;
  simulation: Simulation | undefined;
  // The view's column is the view switcher's tab panel.
  viewPanel: { id: string; label: string };
  children: ReactNode; // the active view
};

// The code editor next to the active view. Always the wrapper of the view,
// also while the code is hidden: hiding collapses the editor column instead of
// changing the React tree, so the view never remounts (#44).
//
// The editor is uncontrolled. It remounts only for a hard replacement of the
// buffer (`editorEpoch`: initial load, Reload from disk); code another program
// wrote into a clean buffer (`externalRevision`) is applied in place, keeping
// the cursor, scroll, focus and the user's undo history (#42). Its state (undo
// history, selection, scroll) is cached when it unmounts and restored when the
// file is shown again (#41).
export const CodePane: FC<Props> = ({
  file,
  open,
  mountEditor,
  fraction,
  onResize,
  onFirstLayout,
  editorRef,
  setCode,
  onSubmit,
  onFocusByPath,
  project,
  simulation,
  viewPanel,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | undefined>(undefined);
  const [dragFraction, setDragFraction] = useState<number | undefined>();

  const onFirstLayoutRef = useRef(onFirstLayout);
  onFirstLayoutRef.current = onFirstLayout;
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const first = el.getBoundingClientRect().width;
    setWidth(first);
    onFirstLayoutRef.current?.(first);
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const stacked = width !== undefined && isStacked(width);
  const shownFraction = dragFraction ?? fraction;
  const editorStyle = stacked
    ? { height: `${clampFraction(shownFraction) * 100}%` }
    : width === undefined
      ? { width: `${clampFraction(shownFraction) * 100}%` }
      : { width: `${codePaneWidth(shownFraction, width)}px` };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    e.preventDefault();
    const rect = container.getBoundingClientRect();
    let latest = clampFraction(shownFraction);
    const onMove = (ev: PointerEvent) => {
      latest = clampFraction(
        stacked
          ? (ev.clientY - rect.top) / rect.height
          : (ev.clientX - rect.left) / rect.width
      );
      setDragFraction(latest);
    };
    const cursor = stacked ? "row-resize" : "col-resize";
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
      setDragFraction(undefined);
      onResize(latest);
    };
    document.body.style.cursor = cursor;
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  // The editor focuser (F6, ⌘1, focusMain): only while the column is shown.
  const openRef = useRef(open);
  openRef.current = open;
  useFocuser(
    "editor",
    useCallback(() => {
      const handle = editorRef.current;
      if (!openRef.current || !handle) return false;
      handle.focus();
      return true;
    }, [editorRef])
  );

  return (
    <div
      ref={containerRef}
      className={clsx("flex h-full min-h-0", stacked && "flex-col")}
      data-stacked={stacked ? "" : undefined}
    >
      <div
        className={clsx(
          "min-w-0 shrink-0 overflow-hidden",
          stacked && "min-h-0 w-full"
        )}
        style={editorStyle}
        data-testid={TID.codePane}
        data-studio-region="editor"
        hidden={!open}
      >
        {mountEditor && (
          <PaneEditor
            // Hard replacement only (initial load, Reload from disk).
            key={`${file.path}:${file.editorEpoch}`}
            file={file}
            editorRef={editorRef}
            setCode={setCode}
            onSubmit={onSubmit}
            onFocusByPath={onFocusByPath}
            project={project}
            simulation={simulation}
          />
        )}
      </div>
      <div
        role="separator"
        aria-orientation={stacked ? "horizontal" : "vertical"}
        aria-label="Resize code pane"
        hidden={!open}
        className={clsx(
          "shrink-0 border-slate-200 bg-white hover:bg-orange-200",
          stacked
            ? "h-1 w-full cursor-row-resize border-t"
            : "w-1 cursor-col-resize border-l"
        )}
        onPointerDown={onPointerDown}
      />
      <div
        id={viewPanel.id}
        role="tabpanel"
        aria-label={viewPanel.label}
        className={clsx(
          "min-h-0 min-w-0 flex-1",
          stacked ? "w-full" : "h-full"
        )}
        data-studio-region="view"
      >
        {children}
      </div>
    </div>
  );
};

const PaneEditor: FC<{
  file: OpenFile;
  editorRef: RefObject<CodeEditorHandle | null>;
  setCode: (code: string) => void;
  onSubmit: () => void;
  onFocusByPath: (path: SqValuePath) => void;
  project: SqProject;
  simulation: Simulation | undefined;
}> = ({
  file,
  editorRef,
  setCode,
  onSubmit,
  onFocusByPath,
  project,
  simulation,
}) => {
  const { path, editorEpoch } = file;
  // Read once, on mount.
  const [initialState] = useState(() => loadEditorState(path, editorEpoch));
  const handleRef = useRef<CodeEditorHandle | null>(null);

  // Keeps the last handle after React clears the ref, for the unmount save.
  const setHandle = useCallback(
    (handle: CodeEditorHandle | null) => {
      if (handle) handleRef.current = handle;
      editorRef.current = handle;
    },
    [editorRef]
  );

  // Saved when the editor unmounts (another file shown, the Playground
  // selected). Layout cleanups run while the DOM is still attached, so the
  // scroll position is still there.
  useLayoutEffect(
    () => () => {
      const snapshot = handleRef.current?.getState();
      if (snapshot) saveEditorState(path, editorEpoch, snapshot);
    },
    [path, editorEpoch]
  );

  // Code another program wrote while the buffer was clean: in place.
  const appliedRevision = useRef(file.externalRevision);
  useEffect(() => {
    if (file.externalRevision === appliedRevision.current) return;
    appliedRevision.current = file.externalRevision;
    handleRef.current?.applyExternalChange(file.buffer);
  }, [file.externalRevision, file.buffer]);

  // The editor reports the remote change as an edit; the buffer already has it.
  const bufferRef = useRef(file.buffer);
  bufferRef.current = file.buffer;
  const onChange = useCallback(
    (code: string) => {
      if (code !== bufferRef.current) setCode(code);
    },
    [setCode]
  );

  return (
    <CodeEditor
      ref={setHandle}
      defaultValue={file.buffer}
      initialState={initialState}
      onChange={onChange}
      onSubmit={onSubmit}
      onFocusByPath={onFocusByPath}
      sourceId={path}
      project={project}
      simulation={simulation}
      height="100%"
      showGutter
    />
  );
};
