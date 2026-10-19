import { clsx } from "clsx";
import {
  createContext,
  FC,
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  type ExternalViewerActions,
  ProjectContext,
  SquiggleErrorAlert,
  ViewerWithMenuBar,
  type ViewerWithMenuBarHandle,
} from "@quri/squiggle-components";
import { SqValuePath, SqValuePathEdge } from "@quri/squiggle-lang";
import { RefreshIcon } from "@quri/ui";

import { TID } from "../../shared/testIds.js";
import { useFocuser } from "../commands/focus.js";
import { runCommand } from "../commands/registry.js";
import { SegmentedControl } from "../components/SegmentedControl.js";
import {
  cardKeyForPath,
  functionSignature,
  isPlottableFunction,
  type OutputCard,
  planOutputCards,
} from "./outputCards.js";
import type {
  StudioRunOutput,
  StudioView,
  StudioViewContext,
} from "./types.js";

export type OutputLayout = "cards" | "list";

// Output's Cards/List layout for the shown file, provided by FileWorkspace
// (global state, or the URL's initial `layout`) to the view and its toolbar.
export const OutputLayoutContext = createContext<OutputLayout>("cards");

// Settings for charts inside cards: shorter than the playground default, so
// that a typical model fits on one screen.
const cardSettings = { chartHeight: 35 }; // zoomed-in charts render at 4x this
const listSettings = {};

// How long a revealed card stays highlighted.
const REVEAL_FLASH_MS = 1200;

function errorText(runOutput: StudioRunOutput): string | undefined {
  const result = runOutput.output.result;
  if (result.ok) return undefined;
  return result.value.errors.map((e) => e.toString()).join("\n");
}

function bindingPath(name: string): SqValuePath {
  return new SqValuePath({
    root: "bindings",
    edges: [SqValuePathEdge.fromKey(name)],
  });
}

const resultPath = new SqValuePath({ root: "result", edges: [] });

function cardsOf(runOutput: StudioRunOutput, embed: boolean) {
  const result = runOutput.output.result;
  if (!result.ok) return undefined;
  return planOutputCards({
    bindings: result.value.bindings.entries(),
    result: result.value.result,
    embed,
  });
}

// The viewer tab that shows one card's value. Memoized: the viewer is, and
// a new object on every render (every keystroke) would re-render it.
function useCardTab(card: OutputCard) {
  const { kind, key } = card;
  return useMemo(
    () => ({
      tag: "CustomVisibleRootPath" as const,
      visibleRootPath: kind === "result" ? resultPath : bindingPath(key),
    }),
    [kind, key]
  );
}

// One value, zoomed in, without the viewer's toolbar.
const ValueCard: FC<{
  runOutput: StudioRunOutput;
  card: OutputCard;
  embed: boolean;
  actions: ExternalViewerActions;
}> = ({ runOutput, card, embed, actions }) => {
  const defaultTab = useCardTab(card);
  return (
    <div
      data-testid={TID.outputCard}
      data-variable={card.key}
      data-value-type={card.value.tag}
      tabIndex={-1}
      className={clsx(
        "min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white py-2 shadow-sm outline-none transition-shadow",
        "data-[revealed]:ring-2 data-[revealed]:ring-orange-300",
        card.kind === "result" && "col-span-full"
      )}
    >
      {/* In embed mode (`render`) the page grows to fit long values: a PNG
        can't scroll (#24). */}
      <div className={embed ? undefined : "max-h-[32rem] overflow-auto"}>
        <ViewerWithMenuBar
          simulation={runOutput.simulation}
          playgroundSettings={cardSettings}
          randomizeSeed={undefined}
          showToolbar={false}
          externalViewerActions={actions}
          defaultTab={defaultTab}
        />
      </div>
    </div>
  );
};

// Functions often can't be plotted (e.g. when they take a distribution), so
// their cards start compact: the name in full, a short signature, @doc, and
// "Show plot" for one-parameter functions (#26).
const FunctionCard: FC<{
  runOutput: StudioRunOutput;
  card: OutputCard;
  actions: ExternalViewerActions;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
}> = ({ runOutput, card, actions, expanded, setExpanded }) => {
  const value = card.value;
  const plottable = isPlottableFunction(value);
  const defaultTab = useCardTab(card);
  if (expanded && plottable) {
    return (
      <div
        data-testid={TID.outputCard}
        data-variable={card.key}
        data-value-type={value.tag}
        tabIndex={-1}
        className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white pt-2 shadow-sm outline-none data-[revealed]:ring-2 data-[revealed]:ring-orange-300"
      >
        <div className="max-h-[32rem] overflow-auto">
          <ViewerWithMenuBar
            simulation={runOutput.simulation}
            playgroundSettings={cardSettings}
            randomizeSeed={undefined}
            showToolbar={false}
            externalViewerActions={actions}
            defaultTab={defaultTab}
          />
        </div>
        <div className="flex justify-end border-t border-slate-100 px-3 py-1">
          <button
            type="button"
            aria-expanded
            className="rounded px-1 text-xs font-medium text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            onClick={() => setExpanded(false)}
          >
            Hide plot
          </button>
        </div>
      </div>
    );
  }
  const title = value.tags.name() ?? card.key;
  const signature =
    value.tag === "Lambda"
      ? functionSignature(value.value.parameterString())
      : "";
  const doc = value.tags.doc();
  return (
    <div
      data-testid={TID.outputCard}
      data-variable={card.key}
      data-value-type={value.tag}
      tabIndex={-1}
      className="min-w-0 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none data-[revealed]:ring-2 data-[revealed]:ring-orange-300"
    >
      <div className="flex min-w-0 items-baseline gap-2">
        <span
          className="max-w-[60%] shrink-0 truncate font-semibold text-slate-800"
          title={title}
        >
          {title}
        </span>
        <code
          className="min-w-0 truncate font-mono text-xs text-slate-500"
          title={signature}
        >
          {signature}
        </code>
        {plottable && (
          <button
            type="button"
            aria-expanded={false}
            className="ml-auto shrink-0 rounded px-1 text-xs font-medium text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            onClick={() => setExpanded(true)}
          >
            Show plot
          </button>
        )}
      </div>
      {doc && <p className="mt-1 text-sm text-slate-600">{doc}</p>}
    </div>
  );
};

const Cards: FC<{
  runOutput: StudioRunOutput;
  embed: boolean;
  actions: ExternalViewerActions;
  expanded: ReadonlySet<string>;
  setExpanded: (name: string, expanded: boolean) => void;
}> = ({ runOutput, embed, actions, expanded, setExpanded }) => {
  const plan = cardsOf(runOutput, embed);
  if (!plan) return null;
  if (plan.message) {
    return (
      <div className="p-8 text-center text-sm text-slate-600">
        {plan.message}
      </div>
    );
  }
  return (
    <div
      className={clsx(
        // One full-width column in a narrow pane (#21); cards only as tall as
        // their content (#61).
        "grid grid-cols-[repeat(auto-fill,minmax(min(22rem,100%),1fr))] items-start gap-3",
        embed ? "p-2" : "p-4"
      )}
    >
      {plan.cards.map((card) =>
        card.kind === "function" ? (
          <FunctionCard
            key={card.key}
            runOutput={runOutput}
            card={card}
            actions={actions}
            expanded={expanded.has(card.key)}
            setExpanded={(on) => setExpanded(card.key, on)}
          />
        ) : (
          <ValueCard
            key={card.key}
            runOutput={runOutput}
            card={card}
            embed={embed}
            actions={actions}
          />
        )
      )}
    </div>
  );
};

// Embed mode's `?variable=name` (`render --variable`): one variable, zoomed
// in. An unknown name is an error that `render` reports (#47).
const SingleVariable: FC<{
  runOutput: StudioRunOutput;
  variable: string;
  actions: ExternalViewerActions;
}> = ({ runOutput, variable, actions }) => {
  const defaultTab = useMemo(
    () => ({
      tag: "CustomVisibleRootPath" as const,
      visibleRootPath: bindingPath(variable),
    }),
    [variable]
  );
  const bindings = runOutput.output.getBindings();
  if (bindings.ok && !bindings.value.get(variable)) {
    return (
      <div
        className="p-4 text-sm text-red-700"
        data-testid={TID.outputError}
        data-studio-error=""
      >
        Variable <code>{variable}</code> is not defined.
      </div>
    );
  }
  return (
    <ViewerWithMenuBar
      simulation={runOutput.simulation}
      playgroundSettings={listSettings}
      randomizeSeed={undefined}
      // No "simulation #N in N ms" row: the run is in the status bar, and a
      // render of one variable shows just the value (#61).
      showToolbar={false}
      externalViewerActions={actions}
      defaultTab={defaultTab}
    />
  );
};

// Output's Cards/List control in the editor header, hidden when there is
// nothing to lay out (#61).
const OutputToolbar: FC<{ context: StudioViewContext }> = ({ context }) => {
  const layout = useContext(OutputLayoutContext);
  const { runOutput } = context;
  if (context.embed || !runOutput) return null;
  const plan = cardsOf(runOutput, false);
  if (!plan || plan.cards.length === 0) return null;
  return (
    <SegmentedControl
      label="Output layout"
      testId={TID.layoutToggle}
      value={layout}
      options={[
        { value: "cards", label: "Cards" },
        { value: "list", label: "List" },
      ]}
      onChange={(l) =>
        runCommand("squiggle.output.setLayout", { layout: l }, "button")
      }
    />
  );
};

function flash(el: HTMLElement) {
  el.setAttribute("data-revealed", "");
  window.setTimeout(() => el.removeAttribute("data-revealed"), REVEAL_FLASH_MS);
}

// Focuses the header of `path` (or of its deepest rendered ancestor) inside a
// card, and highlights the card.
function revealInCards(root: HTMLElement, path: SqValuePath): boolean {
  const key = cardKeyForPath(path);
  if (key === undefined) return false;
  const card = root.querySelector<HTMLElement>(
    `[data-testid="${TID.outputCard}"][data-variable="${CSS.escape(key)}"]`
  );
  if (!card) return false;
  let header: HTMLElement | null = null;
  for (let n = path.edges.length; n >= 0 && !header; n--) {
    const prefix = new SqValuePath({
      root: path.root,
      edges: path.edges.slice(0, n),
    });
    header = card.querySelector<HTMLElement>(
      `header[data-value-path="${CSS.escape(prefix.uid())}"]`
    );
  }
  card.scrollIntoView({ block: "nearest" });
  (header ?? card).focus({ preventScroll: true });
  flash(card);
  return true;
}

// The view focuser (F6, ⌘2): the last focused element still there, else the
// first value header, else the view itself.
function useOutputFocuser(rootRef: RefObject<HTMLDivElement | null>) {
  const lastRef = useRef<WeakRef<HTMLElement> | undefined>(undefined);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onFocusIn = (e: FocusEvent) => {
      if (e.target instanceof HTMLElement)
        lastRef.current = new WeakRef(e.target);
    };
    root.addEventListener("focusin", onFocusIn);
    return () => root.removeEventListener("focusin", onFocusIn);
  }, [rootRef]);
  useFocuser(
    "view",
    useCallback(() => {
      const root = rootRef.current;
      if (!root) return false;
      const last = lastRef.current?.deref();
      const target =
        (last?.isConnected && root.contains(last) ? last : null) ??
        root.querySelector<HTMLElement>('header[tabindex="0"]') ??
        root;
      target.focus();
      // Not yet while the first run is computing (the spinner can't take
      // focus): focusRegion retries.
      return root.contains(document.activeElement);
    }, [rootRef])
  );
}

export const OutputView: FC<{ context: StudioViewContext }> = ({ context }) => {
  const { runOutput, embed, filePath } = context;
  const layout = useContext(OutputLayoutContext);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<ViewerWithMenuBarHandle>(null);
  useOutputFocuser(rootRef);

  // Expanded function plots, by name (#22: they survive reruns).
  const [expanded, setExpandedSet] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const setExpanded = useCallback((name: string, on: boolean) => {
    setExpandedSet((prev) => {
      if (prev.has(name) === on) return prev;
      const next = new Set(prev);
      if (on) next.add(name);
      else next.delete(name);
      return next;
    });
  }, []);

  // While the code is broken (e.g. halfway through an edit by an agent), keep
  // showing the last successful run, dimmed, under the error.
  // It changes only when a run finishes with new output, not when the next
  // run starts (each keystroke), so the cards don't re-render meanwhile.
  const lastGoodRef = useRef<StudioRunOutput | undefined>(undefined);
  if (
    runOutput?.output.result.ok &&
    runOutput.output !== lastGoodRef.current?.output
  ) {
    lastGoodRef.current = runOutput;
  }
  const current = runOutput ?? lastGoodRef.current;

  // Values link to their code: focusing a header scrolls the code pane to it,
  // `e` jumps there (opening the pane) (§5.5).
  const { revealInCode, registerReveal } = context;
  const actions: ExternalViewerActions = useMemo(
    () => ({
      show: (location, focus) => revealInCode(location, focus),
      isFocusable: (location) => location.source === filePath,
      isDefaultSourceId: (sourceId) => sourceId === filePath,
    }),
    [revealInCode, filePath]
  );

  // ⇧⌥V and the gutter markers.
  useEffect(
    () =>
      registerReveal((path) => {
        if (layout === "list") {
          listRef.current?.focusByPath(path);
          if (rootRef.current) flash(rootRef.current);
          return;
        }
        if (rootRef.current) revealInCards(rootRef.current, path);
      }),
    [registerReveal, layout]
  );

  // Outside embed mode `?variable=` reveals that card once (#17).
  const initialVariable = embed ? undefined : context.initial?.variable;
  const revealedInitialRef = useRef(false);
  const ready = current !== undefined && !current.isStale;
  useLayoutEffect(() => {
    if (!initialVariable || revealedInitialRef.current || !ready) return;
    revealedInitialRef.current = true;
    if (rootRef.current) {
      revealInCards(rootRef.current, bindingPath(initialVariable));
    }
  }, [initialVariable, ready]);

  if (!current) {
    return (
      <div
        ref={rootRef}
        data-testid={TID.outputView}
        data-layout={layout}
        data-studio-ready="0"
        className="grid h-full place-items-center"
      >
        <RefreshIcon className="animate-spin text-slate-400" size={24} />
      </div>
    );
  }

  const error = errorText(current);
  const result = current.output.result;
  const shown = lastGoodRef.current;
  const variable = embed ? context.variable : undefined;

  return (
    <ProjectContext.Provider
      value={{
        sourceId: current.sourceId,
        onOpenExport: (sourceId) => {
          if (!sourceId.startsWith("hub:")) context.openFile(sourceId);
        },
      }}
    >
      <div
        ref={rootRef}
        tabIndex={-1}
        data-testid={TID.outputView}
        data-layout={embed && variable ? "variable" : layout}
        // Markers for `squiggle-studio render` and agents (§6.5).
        data-studio-ready={current.isStale ? "0" : "1"}
        className={clsx(
          "flex flex-col bg-slate-50 outline-none data-[revealed]:ring-2 data-[revealed]:ring-inset data-[revealed]:ring-orange-300",
          // In embed mode the page grows with the content, so that full-page
          // screenshots capture everything.
          !embed && "h-full"
        )}
      >
        {error !== undefined && (
          <pre data-studio-error="" className="hidden">
            {error}
          </pre>
        )}
        <div className={clsx("min-h-0 flex-1", !embed && "overflow-auto")}>
          {!result.ok && (
            <div data-testid={TID.outputError} className="px-4 pt-4">
              <SquiggleErrorAlert error={result.value.errors[0]} />
              {shown && (
                <p className="mt-2 text-xs text-slate-600">
                  Showing the last successful run.
                </p>
              )}
            </div>
          )}
          {shown && (
            <div
              className={clsx(!result.ok && "opacity-50")}
              // The dimmed last successful run is inactive, stale content
              // (WCAG's contrast rule exempts it; so does the harness).
              aria-disabled={result.ok ? undefined : true}
            >
              {variable ? (
                <div className="bg-white p-2">
                  <SingleVariable
                    runOutput={shown}
                    variable={variable}
                    actions={actions}
                  />
                </div>
              ) : layout === "cards" ? (
                <Cards
                  runOutput={shown}
                  embed={embed}
                  actions={actions}
                  expanded={expanded}
                  setExpanded={setExpanded}
                />
              ) : (
                // The viewer's own "simulation #N in N ms" is hidden: the
                // status bar shows the run (#61).
                <div className={embed ? "p-2" : "p-4"}>
                  <div className="mx-auto max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm [&_[data-simulation-indicator]]:hidden">
                    <ViewerWithMenuBar
                      ref={listRef}
                      simulation={shown.simulation}
                      playgroundSettings={listSettings}
                      randomizeSeed={undefined}
                      showMenu={true}
                      externalViewerActions={actions}
                      xPadding={4}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProjectContext.Provider>
  );
};

export const outputView: StudioView = {
  id: "output",
  label: "Output",
  isAvailable: () => true,
  render: (context) => <OutputView context={context} />,
  renderToolbar: (context) => <OutputToolbar context={context} />,
};
