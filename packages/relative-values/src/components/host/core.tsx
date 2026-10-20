"use client";
import {
  createContext,
  FC,
  type Ref,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import { PairSet } from "../../state/pairs.js";
import {
  type NormalizeContext,
  normalizeRelativeValuesState,
  resolveRelativeValuesStateKeys,
  stableStringify,
} from "../../state/resolve.js";
import { selectNormalizedRelativeValues } from "../../state/select.js";
import type {
  RelativeValuesData,
  RelativeValuesScope,
  RelativeValuesSorts,
  RelativeValuesState,
  RelativeValuesStateInput,
  RelativeValuesStateKey,
} from "../../state/types.js";
import { clustersIn, computeUniverse } from "../../state/universe.js";
import type { Item, RelativeValuesDefinition } from "../../types.js";
import { InMemoryRelativeValuesCache } from "../../values/cache.js";
import { ModelEvaluator } from "../../values/ModelEvaluator.js";
import { PresentationProvider } from "./presentation.js";
import { requirementPairs, type RequirementEntry } from "./requirements.js";
import { useRelativeValuesSource } from "./source.js";
import type {
  ClusterOverrides,
  RelativeValuesActions,
  RelativeValuesHandle,
  RelativeValuesProgress,
  RelativeValuesProviderProps,
} from "./types.js";
import {
  dispatchBase,
  type DispatchContext,
  type DispatchPlace,
  type DispatchSource,
  type PickKey,
  useIsomorphicLayoutEffect,
  useStateController,
} from "./useStateController.js";
import { warnOnce } from "./warn.js";
import type { RelativeValuesAction } from "../../state/reducer.js";

export type Snapshot = {
  definition: RelativeValuesDefinition;
  evaluator: ModelEvaluator;
  // Identifies the pairs: item ids, clusters and units.
  key: string;
};

export type CoreContextValue = {
  // Unique per provider; views carry it as `data-rv-provider`.
  id: string;
  status: "loading" | "error" | "ready";
  error: string | undefined;
  // What the views show; the previous definition and evaluator while the
  // new ones compute (`isStale`).
  snapshot: Snapshot | undefined;
  isStale: boolean;
  // Pairs are computed asynchronously (precompute is on and the evaluator
  // runs Squiggle); views wait for their pairs.
  asyncCompute: boolean;
  state: RelativeValuesState<string>;
  isLocked(key: RelativeValuesStateKey): boolean;
  // `place`: where in the built-in UI the user made the change.
  dispatch(
    action: RelativeValuesAction,
    source: DispatchSource,
    place?: DispatchPlace
  ): void;
  // Whether the current `unit` or `selectedPair` is one the user set in the
  // built-in UI (and where), rather than the host (`defaultState`,
  // controlled state, `actions`, `apiRef`).
  userPick(key: PickKey): { place: DispatchPlace | undefined } | undefined;
  actions: RelativeValuesActions<string>;
  data: RelativeValuesData;
  // The pipeline for the state with local overrides.
  selectWith(overrides: RelativeValuesStateInput<string>): RelativeValuesData;
  // Increases when pairs were computed.
  version: number;
  // Increases when a consumer registers or changes its requirement; with
  // `version`, consumers re-check whether their pairs are cached (another
  // provider on the same evaluator may have computed them).
  registryVersion: number;
  register(id: string, entry: RequirementEntry): void;
  unregister(id: string): void;
  // Every mounted consumer's pairs are computed.
  allReady: boolean;
  // Host-registered sorts (for the sort menus).
  sorts: RelativeValuesSorts | undefined;
};

const CoreContext = createContext<CoreContextValue | null>(null);
const ProgressContext = createContext<RelativeValuesProgress | undefined>(
  undefined
);

export function useOptionalCore(): CoreContextValue | null {
  return useContext(CoreContext);
}

export function useCore(): CoreContextValue {
  const core = useContext(CoreContext);
  if (!core) {
    throw new Error(
      "Relative values components must be used inside RelativeValuesProvider (or a dashboard)"
    );
  }
  return core;
}

export function useProgress(): RelativeValuesProgress | undefined {
  return useContext(ProgressContext);
}

const emptyDefinition: RelativeValuesDefinition = {
  title: "",
  items: [],
  clusters: [],
};
let emptyEvaluatorInstance: ModelEvaluator | undefined;
export function emptyEvaluator(): ModelEvaluator {
  emptyEvaluatorInstance ??= ModelEvaluator.fromCache(
    new InMemoryRelativeValuesCache()
  );
  return emptyEvaluatorInstance;
}

// Identifies the set of pairs, ignoring titles, names and colors.
export function structureKey(definition: RelativeValuesDefinition): string {
  return JSON.stringify([
    definition.items.map((item) => [item.id, item.clusterId ?? null]),
    definition.clusters.map((cluster) => [
      cluster.id,
      cluster.recommendedUnit ?? null,
    ]),
    definition.recommendedUnit ?? null,
  ]);
}

export function applyClusterOverrides(
  definition: RelativeValuesDefinition,
  overrides: ClusterOverrides | undefined
): RelativeValuesDefinition {
  if (!overrides) {
    return definition;
  }
  return {
    ...definition,
    clusters: definition.clusters.map((cluster) => {
      const override = overrides[cluster.id];
      return override
        ? {
            ...cluster,
            name: override.name ?? cluster.name,
            color: override.color ?? cluster.color,
          }
        : cluster;
    }),
  };
}

type Prepared = {
  universe: Item[];
  universeKey: string;
  // Undefined while the definition is loading.
  normalize: NormalizeContext<string> | undefined;
  state: RelativeValuesState<string>;
  warnings: string[];
  universeClusters: string[];
};

// The universe and the normalized state for a snapshot. `scope.where` runs on
// every render; the rest is memoized by the resulting ids.
function usePrepared(
  definition: RelativeValuesDefinition | undefined,
  raw: RelativeValuesState<string>,
  rawKey: string,
  scope: RelativeValuesScope | undefined,
  sorts: RelativeValuesSorts | undefined,
  sortsKey: string,
  views: readonly string[]
): Prepared {
  const universe = definition
    ? computeUniverse(definition, scope)
    : { items: [], warnings: [] };
  const universeKey = stableStringify([
    universe.items.map((item) => item.id),
    universe.warnings,
  ]);
  const latest = useRef({ universe, sorts, raw });
  latest.current = { universe, sorts, raw };
  const viewsKey = views.join("\0");

  return useMemo(() => {
    const { universe, sorts, raw } = latest.current;
    if (!definition) {
      // Loading: ids can't be checked yet (and aren't reported as unknown).
      return {
        universe: [],
        universeKey,
        normalize: undefined,
        state:
          views.length > 0 && !views.includes(raw.view)
            ? { ...raw, view: views[0] }
            : raw,
        warnings: [],
        universeClusters: [],
      };
    }
    // A scope without functions that gives the same universe.
    const normalize: NormalizeContext<string> = {
      definition,
      views,
      scope: { ids: universe.items.map((item) => item.id) },
      sorts,
    };
    const normalized = normalizeRelativeValuesState(raw, normalize);
    return {
      universe: universe.items,
      universeKey,
      normalize,
      state: normalized.state,
      warnings: [...universe.warnings, ...normalized.warnings],
      universeClusters: clustersIn(definition, universe.items).map(
        (cluster) => cluster.id
      ),
    };
    // Identified by the keys.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definition, rawKey, universeKey, sortsKey, viewsKey]);
}

function selectFor(
  snapshot: Snapshot | undefined,
  prepared: Prepared,
  state: RelativeValuesState<string>,
  warnings: string[],
  sorts: RelativeValuesSorts | undefined,
  compute: "sync" | "cached",
  locale: string | undefined
): RelativeValuesData {
  return selectNormalizedRelativeValues({
    definition: snapshot?.definition ?? emptyDefinition,
    evaluator: snapshot?.evaluator ?? emptyEvaluator(),
    state,
    warnings,
    universe: prepared.universe,
    scope: prepared.normalize?.scope,
    sorts,
    compute,
    locale,
  });
}

function withOverrides(
  prepared: Prepared,
  overrides: RelativeValuesStateInput<string>
): { state: RelativeValuesState<string>; warnings: string[] } {
  const state = {
    ...prepared.state,
    ...resolveRelativeValuesStateKeys(overrides),
  };
  return prepared.normalize
    ? normalizeRelativeValuesState(state, prepared.normalize)
    : { state, warnings: [] };
}

// Ids of the sort modes that a state uses.
function sortModesOf(
  state: RelativeValuesState<string> | RelativeValuesStateInput<string>
): string[] {
  const modes: string[] = [];
  const add = (sort: { mode?: string } | null | undefined) => {
    if (sort?.mode !== undefined) {
      modes.push(sort.mode);
    }
  };
  add(state.sort);
  add(state.limitBy);
  if (state.columns !== undefined && state.columns !== "rows") {
    add(state.columns.sort);
    add(state.columns.limitBy);
  }
  return modes;
}

const quote = (value: string) => value.replace(/["\\]/g, "\\$&");

// `display: contents` elements (list rows) have no box to scroll to: use
// their first descendant that has one.
function scrollableElement(element: Element): Element {
  let current: Element = element;
  while (
    typeof getComputedStyle === "function" &&
    getComputedStyle(current).display === "contents" &&
    current.firstElementChild
  ) {
    current = current.firstElementChild;
  }
  return current;
}

function scrollToTarget(
  providerId: string,
  target: { item: string } | { pair: readonly [string, string] }
) {
  if (typeof document === "undefined") {
    return;
  }
  const scope = `[data-rv-provider="${quote(providerId)}"]`;
  const selectors =
    "item" in target
      ? [
          `${scope} [data-rv-item="${quote(target.item)}"]`,
          `${scope} [data-rv-row="${quote(target.item)}"]`,
        ]
      : [
          `${scope} [data-rv-row="${quote(target.pair[0])}"][data-rv-column="${quote(target.pair[1])}"]`,
          `${scope} [data-rv-item="${quote(target.pair[0])}"]`,
        ];
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      scrollableElement(element).scrollIntoView({
        block: "nearest",
        inline: "nearest",
      });
      return;
    }
  }
}

export type CoreProviderProps = RelativeValuesProviderProps & {
  // Valid views (tab ids); empty: any view.
  views?: readonly string[];
  // Default: the first of `views`, else "list".
  firstView?: string;
  // Aliases of state.view, defaultState.view and view changes.
  tab?: string;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
  // `precompute` when the prop isn't set.
  defaultPrecompute?: boolean | "visible";
};

const noViews: readonly string[] = [];

/**
 * The provider behind dashboards, single views and `RelativeValuesProvider`:
 * loads the source, owns the state, runs the pipeline and computes the pairs
 * that mounted consumers need. Renders no DOM.
 */
export const RelativeValuesCoreProvider: FC<CoreProviderProps> = (props) => {
  const {
    children,
    precompute: precomputeProp,
    defaultPrecompute,
    scope,
    sorts,
    clusterOverrides,
    state,
    defaultState,
    onStateChange,
    locked,
    apiRef,
    views = noViews,
    firstView,
    tab,
    initialTab,
    onTabChange,
    controls,
    components,
    labels,
    format,
    display,
    getPlaygroundUrl,
    linker,
    sourceId,
    onItemClick,
    renderItemName,
    onPairClick,
  } = props;
  const id = useId();

  if (sorts) {
    for (const sortId of Object.keys(sorts)) {
      if (sortId.startsWith("-")) {
        throw new Error(
          `Custom sort ids can't start with "-" (used for descending sorts in URLs): ${sortId}`
        );
      }
    }
  }

  const source = useRelativeValuesSource(props);
  const explicit =
    props.definition !== undefined && props.evaluator !== undefined;
  const precompute = precomputeProp ?? defaultPrecompute ?? !explicit;
  const locale = format?.locale;

  const clusterOverridesKey = stableStringify(clusterOverrides ?? null);
  const sourceDefinition = source.definition;
  const definition = useMemo(
    () =>
      sourceDefinition &&
      applyClusterOverrides(sourceDefinition, clusterOverrides),
    // Compared by value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sourceDefinition, clusterOverridesKey]
  );
  const evaluator = source.evaluator;
  const current = useMemo(
    (): Snapshot | undefined =>
      definition && evaluator
        ? { definition, evaluator, key: structureKey(definition) }
        : undefined,
    [definition, evaluator]
  );

  // Requirements of the mounted consumers.
  const registry = useRef(new Map<string, RequirementEntry>());
  const [registryVersion, setRegistryVersion] = useState(0);
  const register = useCallback((consumer: string, entry: RequirementEntry) => {
    registry.current.set(consumer, entry);
    setRegistryVersion((v) => v + 1);
  }, []);
  const unregister = useCallback((consumer: string) => {
    if (registry.current.delete(consumer)) {
      setRegistryVersion((v) => v + 1);
    }
  }, []);
  const [mounted, setMounted] = useState(false);
  useIsomorphicLayoutEffect(() => setMounted(true), []);

  const [version, setVersion] = useState(0);
  const [progress, setProgress] = useState<RelativeValuesProgress>();
  const [computeError, setComputeError] = useState<string>();

  const dispatchContext = useRef<DispatchContext | undefined>(undefined);
  const controller = useStateController({
    firstView: firstView ?? views[0] ?? "list",
    state,
    defaultState,
    tab,
    initialTab,
    onStateChange,
    onTabChange,
    locked,
    context: dispatchContext,
  });

  const sortsKey = sorts
    ? stableStringify(Object.entries(sorts).map(([key, s]) => [key, s.label]))
    : "";
  const sortsRef = useRef(sorts);
  sortsRef.current = sorts;
  // Increases when the compare function of a sort in use changes (e.g. it
  // closes over host data that loaded later), so that the order is
  // recomputed. Compared by identity: memoize compare functions if the host
  // re-renders often.
  const activeCompares = sorts
    ? [
        ...sortModesOf(controller.raw),
        ...[...registry.current.values()].flatMap((entry) =>
          entry.overrides ? sortModesOf(entry.overrides) : []
        ),
      ].map((mode) =>
        Object.prototype.hasOwnProperty.call(sorts, mode)
          ? sorts[mode].compare
          : undefined
      )
    : [];
  const lastCompares = useRef(activeCompares);
  const comparesRevision = useRef(0);
  if (
    activeCompares.length !== lastCompares.current.length ||
    activeCompares.some((compare, i) => compare !== lastCompares.current[i])
  ) {
    lastCompares.current = activeCompares;
    comparesRevision.current++;
  }
  const sortsRevision = comparesRevision.current;

  // Snapshot: the current source if its pairs are computed, else the last
  // complete one (stale while recomputing, e.g. after a live reload).
  const lastComplete = useRef<Snapshot | undefined>(undefined);
  const preparedCurrent = usePrepared(
    current?.definition,
    controller.raw,
    controller.rawKey,
    scope,
    sorts,
    sortsKey,
    views
  );
  const currentAsync =
    !!current && precompute !== false && current.evaluator.canCompute;

  const currentRequired = useMemo(() => {
    const ranking = new PairSet();
    const visible = new PairSet();
    if (current && currentAsync) {
      const base = selectFor(
        current,
        preparedCurrent,
        preparedCurrent.state,
        preparedCurrent.warnings,
        sortsRef.current,
        "cached",
        locale
      );
      for (const entry of registry.current.values()) {
        const data = entry.overrides
          ? selectFor(
              current,
              preparedCurrent,
              withOverrides(preparedCurrent, entry.overrides).state,
              [],
              sortsRef.current,
              "cached",
              locale
            )
          : base;
        const pairs = requirementPairs(entry.requirement, data);
        ranking.addAll(pairs.ranking);
        visible.addAll(pairs.pairs);
      }
    }
    return { ranking: ranking.pairs, visible: visible.pairs };
    // `version`: the pipeline reads computed values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    current,
    currentAsync,
    preparedCurrent,
    registryVersion,
    version,
    locale,
    sortsRevision,
  ]);

  const currentComplete = useMemo(
    () =>
      !current ||
      !currentAsync ||
      (current.evaluator.isCached(currentRequired.ranking) &&
        current.evaluator.isCached(currentRequired.visible)),
    [current, currentAsync, currentRequired]
  );

  const last = lastComplete.current;
  let shown: Snapshot | undefined;
  let isStale = false;
  if (source.status === "error") {
    shown = undefined;
  } else if (
    current &&
    (currentComplete ||
      !last ||
      (last.evaluator === current.evaluator && last.key === current.key))
  ) {
    shown = current;
  } else if (last) {
    shown = last;
    isStale = true;
  } else {
    shown = current;
  }

  useEffect(() => {
    if (current && currentComplete && registry.current.size > 0) {
      lastComplete.current = current;
    }
  });

  const preparedLast = usePrepared(
    last?.definition,
    controller.raw,
    controller.rawKey,
    scope,
    sorts,
    sortsKey,
    views
  );
  const prepared = shown === current ? preparedCurrent : preparedLast;
  const shownAsync =
    !!shown && precompute !== false && shown.evaluator.canCompute;
  const compute = shownAsync ? "cached" : "sync";

  const data = useMemo(
    () =>
      selectFor(
        shown,
        prepared,
        prepared.state,
        prepared.warnings,
        sortsRef.current,
        compute,
        locale
      ),
    // `version`: the pipeline reads computed values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shown, prepared, compute, version, locale, sortsRevision]
  );
  const dataRef = useRef(data);
  dataRef.current = data;

  const selectWith = useCallback(
    (overrides: RelativeValuesStateInput<string>) => {
      const normalized = withOverrides(prepared, overrides);
      return selectFor(
        shown,
        prepared,
        normalized.state,
        [...prepared.warnings, ...normalized.warnings],
        sortsRef.current,
        compute,
        locale
      );
    },
    // `version`: a new function when values were computed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shown, prepared, compute, version, locale, sortsRevision]
  );

  useIsomorphicLayoutEffect(() => {
    dispatchContext.current = {
      effective: prepared.state,
      normalize: prepared.normalize,
      universeClusters: prepared.universeClusters,
    };
  });
  // Before the first layout effect (e.g. a dispatch from a child's effect).
  dispatchContext.current ??= {
    effective: prepared.state,
    normalize: prepared.normalize,
    universeClusters: prepared.universeClusters,
  };

  useEffect(() => {
    for (const warning of prepared.warnings) {
      warnOnce(warning);
    }
  }, [prepared.warnings]);

  // Picks that the user made in the dashboard's built-in UI (uncontrolled
  // `unit`, `clusterUnits` entries and `selectedPair`) whose item is gone
  // from the shown definition, e.g. after a live reload, are forgotten
  // (QA #28): the list stays on the recommended unit and the sidebar stays
  // closed when the item comes back. Other keys, controlled and locked keys,
  // and the host's values (`defaultState`, `actions`, `apiRef`) keep their
  // raw ids (see "Unknown or stale ids").
  const {
    raw: rawState,
    forget,
    userPick,
    isUserClusterUnit,
    isLocked: isKeyLocked,
  } = controller;
  useIsomorphicLayoutEffect(() => {
    if (!shown || shown !== current || !prepared.normalize) {
      return;
    }
    const effective = prepared.state;
    const picked = (key: PickKey) =>
      !isKeyLocked(key) && userPick(key) !== undefined;
    const patch: Partial<RelativeValuesState<string>> = {};
    if (rawState.unit !== effective.unit && picked("unit")) {
      patch.unit = effective.unit;
    }
    if (!isKeyLocked("clusterUnits")) {
      const entries = Object.entries(rawState.clusterUnits);
      const kept = entries.filter(
        ([cluster, unit]) =>
          effective.clusterUnits[cluster] === unit ||
          !isUserClusterUnit(cluster, unit)
      );
      if (kept.length < entries.length) {
        patch.clusterUnits = Object.fromEntries(kept);
      }
    }
    if (
      rawState.selectedPair !== null &&
      effective.selectedPair === null &&
      picked("selectedPair")
    ) {
      patch.selectedPair = null;
    }
    if (Object.keys(patch).length) {
      forget(patch);
    }
  }, [
    shown,
    current,
    prepared,
    rawState,
    forget,
    userPick,
    isUserClusterUnit,
    isKeyLocked,
  ]);

  // Compute the pairs that the consumers need: the ranking first (it decides
  // which items are shown), then the visible pairs, then (precompute: true)
  // every pair in scope, in the background.
  useEffect(() => {
    if (!current || !currentAsync || !mounted) {
      setProgress(undefined);
      return;
    }
    const { evaluator } = current;
    const controller = new AbortController();
    const { signal } = controller;
    let reported = 0;
    const report =
      (background: boolean) => (p: { done: number; total: number }) => {
        // At most ~10 updates per second.
        const now = performance.now();
        if (p.done === p.total || now - reported > 100) {
          reported = now;
          setProgress({ ...p, background });
        }
      };
    const computed = () => setVersion((v) => v + 1);
    const run = async () => {
      setComputeError(undefined);
      for (const pairs of [currentRequired.ranking, currentRequired.visible]) {
        if (!evaluator.isCached(pairs)) {
          await evaluator.computePairs(pairs, {
            signal,
            onProgress: report(false),
          });
          computed();
          return;
        }
      }
      if (!currentComplete) {
        // Another provider on the same evaluator computed the pairs between
        // this render and this effect: render again, so that the views
        // (and whenReady) see them.
        computed();
        return;
      }
      if (precompute === true) {
        const set = new PairSet();
        set.addProduct(preparedCurrent.universe, preparedCurrent.universe);
        const all = set.pairs;
        if (!evaluator.isCached(all)) {
          await evaluator.computePairs(all, {
            signal,
            onProgress: report(true),
          });
          computed();
          return;
        }
      }
      setProgress(undefined);
    };
    run().catch((e: unknown) => {
      if (!signal.aborted) {
        setComputeError(e instanceof Error ? e.message : String(e));
        setProgress(undefined);
      }
    });
    return () => controller.abort();
  }, [
    current,
    currentAsync,
    currentRequired,
    currentComplete,
    precompute,
    mounted,
    preparedCurrent,
  ]);

  const status: CoreContextValue["status"] =
    source.status === "error" || computeError !== undefined
      ? "error"
      : shown
        ? "ready"
        : "loading";
  const error =
    source.status === "error" ? source.error : (computeError ?? undefined);
  const allReady = mounted && status === "ready" && !isStale && currentComplete;

  // whenReady()
  const allReadyRef = useRef(allReady);
  allReadyRef.current = allReady;
  const readyResolvers = useRef<(() => void)[]>([]);
  useEffect(() => {
    if (allReady) {
      const resolvers = readyResolvers.current;
      readyResolvers.current = [];
      resolvers.forEach((resolve) => resolve());
    }
  }, [allReady]);
  const whenReady = useCallback(
    () =>
      allReadyRef.current
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            readyResolvers.current.push(resolve);
          }),
    []
  );

  const { dispatch, isLocked } = controller;
  const actions = useMemo((): RelativeValuesActions<string> => {
    const api = (action: RelativeValuesAction) => dispatch(action, "api");
    return {
      setView: (view) => api({ type: "setView", view }),
      setUnit: (unit, options) =>
        api(
          options?.cluster === undefined
            ? { type: "setUnit", unit }
            : { type: "setUnit", unit, cluster: options.cluster }
        ),
      setSearch: (search) => api({ type: "setSearch", search }),
      setClusters: (clusters, axis = "rows") =>
        api({ type: "setClusters", clusters, axis }),
      toggleCluster: (cluster, axis = "rows") =>
        api({ type: "toggleCluster", cluster, axis }),
      setSort: (sort, axis = "rows") => api({ type: "setSort", sort, axis }),
      setLimit: (limit, axis = "rows") =>
        api({ type: "setLimit", limit, axis }),
      setGridMode: (mode) => api({ type: "setGridMode", mode }),
      selectItem: (item) => api({ type: "selectItem", id: item }),
      selectPair: (pair) => api({ type: "selectPair", pair }),
      setState: (update) => {
        const context = dispatchContext.current;
        if (!context) {
          return;
        }
        api({
          type: "set",
          input:
            typeof update === "function"
              ? update(dispatchBase(context))
              : update,
        });
      },
      reset: (keys) => api({ type: "reset", keys }),
    };
  }, [dispatch]);

  useImperativeHandle(
    apiRef as Ref<RelativeValuesHandle<string>> | undefined,
    (): RelativeValuesHandle<string> => ({
      getState: () =>
        dispatchContext.current
          ? dispatchBase(dispatchContext.current)
          : dataRef.current.state,
      setState: actions.setState,
      reset: actions.reset,
      getData: () => dataRef.current,
      scrollTo: (target) => scrollToTarget(id, target),
      whenReady,
    }),
    [actions, id, whenReady]
  );

  const core = useMemo(
    (): CoreContextValue => ({
      id,
      status,
      error,
      snapshot: shown,
      isStale,
      asyncCompute: shownAsync,
      state: prepared.state,
      isLocked,
      dispatch,
      userPick,
      actions,
      data,
      selectWith,
      version,
      registryVersion,
      register,
      unregister,
      allReady,
      sorts,
    }),
    [
      id,
      status,
      error,
      shown,
      isStale,
      shownAsync,
      prepared.state,
      isLocked,
      dispatch,
      userPick,
      actions,
      data,
      selectWith,
      version,
      registryVersion,
      register,
      unregister,
      allReady,
      sorts,
    ]
  );

  return (
    <CoreContext.Provider value={core}>
      <ProgressContext.Provider value={progress}>
        <PresentationProvider
          controls={controls}
          components={components}
          labels={labels}
          format={format}
          display={display}
          getPlaygroundUrl={getPlaygroundUrl}
          linker={linker}
          sourceId={sourceId}
          onItemClick={onItemClick}
          renderItemName={renderItemName}
          onPairClick={onPairClick}
        >
          {children}
        </PresentationProvider>
      </ProgressContext.Provider>
    </CoreContext.Provider>
  );
};
