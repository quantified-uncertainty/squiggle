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
  type DispatchContext,
  type DispatchSource,
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
  dispatch(action: RelativeValuesAction, source: DispatchSource): void;
  actions: RelativeValuesActions<string>;
  data: RelativeValuesData;
  // The pipeline for the state with local overrides.
  selectWith(overrides: RelativeValuesStateInput<string>): RelativeValuesData;
  // Increases when pairs were computed.
  version: number;
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
  normalize: NormalizeContext<string>;
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
    const def = definition ?? emptyDefinition;
    // A scope without functions that gives the same universe.
    const normalize: NormalizeContext<string> = {
      definition: def,
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
      universeClusters: clustersIn(def, universe.items).map(
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
    scope: prepared.normalize.scope,
    sorts,
    compute,
    locale,
  });
}

function withOverrides(
  prepared: Prepared,
  overrides: RelativeValuesStateInput<string>
) {
  return normalizeRelativeValuesState(
    { ...prepared.state, ...resolveRelativeValuesStateKeys(overrides) },
    prepared.normalize
  );
}

const quote = (value: string) => value.replace(/["\\]/g, "\\$&");

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
      element.scrollIntoView({ block: "nearest", inline: "nearest" });
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
    [shown, prepared, compute, version, locale]
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
    [shown, prepared, compute, version, locale]
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
        const effective = dispatchContext.current?.effective;
        if (!effective) {
          return;
        }
        api({
          type: "set",
          input: typeof update === "function" ? update(effective) : update,
        });
      },
      reset: (keys) => api({ type: "reset", keys }),
    };
  }, [dispatch]);

  useImperativeHandle(
    apiRef as Ref<RelativeValuesHandle<string>> | undefined,
    (): RelativeValuesHandle<string> => ({
      getState: () =>
        dispatchContext.current?.effective ?? dataRef.current.state,
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
      actions,
      data,
      selectWith,
      version,
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
      actions,
      data,
      selectWith,
      version,
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
