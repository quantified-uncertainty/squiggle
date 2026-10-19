"use client";
import {
  type MutableRefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  type RelativeValuesAction,
  relativeValuesActionReason,
  reduceRelativeValuesState,
} from "../../state/reducer.js";
import {
  changedRelativeValuesStateKeys,
  type NormalizeContext,
  normalizeRelativeValuesState,
  resolveRelativeValuesState,
  resolveRelativeValuesStateKeys,
  stableStringify,
} from "../../state/resolve.js";
import type {
  RelativeValuesState,
  RelativeValuesStateChange,
  RelativeValuesStateInput,
  RelativeValuesStateKey,
} from "../../state/types.js";
import { warnOnce } from "./warn.js";

// No layout effects on the server.
export const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export type DispatchSource = "user" | "api";

/** What `dispatch` needs to know about the dashboard as the user sees it. */
export type DispatchContext = {
  // The effective, normalized state (with the uncontrolled changes that
  // aren't rendered yet).
  effective: RelativeValuesState<string>;
  // The last `next` proposed in the current event, until the event ends (or
  // the next render). Later changes in the same event build on it, also for
  // controlled keys that the host hasn't passed back yet.
  proposed?: RelativeValuesState<string>;
  // Undefined while the definition is loading: changes aren't normalized.
  normalize: NormalizeContext<string> | undefined;
  // Known clusters in scope (for toggling a cluster while all are selected).
  universeClusters: readonly string[];
};

/** The state that the next change builds on. */
export function dispatchBase(
  context: DispatchContext
): RelativeValuesState<string> {
  return context.proposed ?? context.effective;
}

const afterEvent: (callback: () => void) => void =
  typeof queueMicrotask === "function"
    ? queueMicrotask
    : (callback) => void Promise.resolve().then(callback);

export type StateControllerOptions = {
  // The view used when none is given (the first tab).
  firstView: string;
  // Controlled keys (undefined values are uncontrolled).
  state: RelativeValuesStateInput<string> | undefined;
  // Initial values of the other keys; read on mount.
  defaultState: RelativeValuesStateInput<string> | undefined;
  // Aliases of state.view / defaultState.view.
  tab: string | undefined;
  initialTab: string | undefined;
  onStateChange:
    | ((
        next: RelativeValuesState<string>,
        change: RelativeValuesStateChange<string>
      ) => void)
    | undefined;
  onTabChange: ((tab: string) => void) | undefined;
  locked: readonly RelativeValuesStateKey[] | undefined;
  // Set by the caller on every render.
  context: MutableRefObject<DispatchContext | undefined>;
};

export type StateController = {
  // Internal state with the controlled keys applied; not normalized.
  raw: RelativeValuesState<string>;
  rawKey: string;
  isLocked(key: RelativeValuesStateKey): boolean;
  dispatch(action: RelativeValuesAction, source: DispatchSource): void;
  // Replaces internal values of uncontrolled keys without a change event,
  // for values whose effective (normalized) value stays the same.
  forget(patch: Partial<RelativeValuesState<string>>): void;
};

/**
 * Controlled and uncontrolled state, per key (see the README):
 *
 * - effective = normalize(internal state, overridden by the controlled keys);
 * - changes go through the reducer, then: the internal state takes the new
 *   values of the uncontrolled keys, and `onStateChange` is called
 *   synchronously (never during render);
 * - locked keys ignore changes from the built-in UI.
 */
export function useStateController(
  options: StateControllerOptions
): StateController {
  const {
    firstView,
    state: controlledState,
    defaultState,
    tab,
    initialTab,
    onStateChange,
    onTabChange,
    locked,
    context,
  } = options;

  const [internal, setInternal] = useState<RelativeValuesState<string>>(() =>
    resolveRelativeValuesState(
      { ...defaultState, view: defaultState?.view ?? initialTab },
      { view: firstView }
    )
  );
  // What `reset` returns to: `defaultState`, then the defaults.
  const initialRef = useRef(internal);

  if (tab !== undefined && controlledState?.view !== undefined) {
    warnOnce("Both `tab` and `state.view` are set; `state.view` is used.");
  }
  const controlledInput: RelativeValuesStateInput<string> = {
    ...(tab === undefined ? {} : { view: tab }),
  };
  for (const [key, value] of Object.entries(controlledState ?? {})) {
    if (value !== undefined) {
      Object.assign(controlledInput, { [key]: value });
    }
  }
  const controlledKey = stableStringify(controlledInput);
  const controlled = useMemo(
    () => resolveRelativeValuesStateKeys(controlledInput),
    // Compared by value, so that a new literal on every render is free.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [controlledKey]
  );
  const controlledKeys = useMemo(
    () => new Set(Object.keys(controlled) as RelativeValuesStateKey[]),
    [controlled]
  );

  const raw = useMemo(
    () => ({ ...internal, ...controlled }),
    [internal, controlled]
  );
  const rawKey = useMemo(() => stableStringify(raw), [raw]);

  // A controlled key's internal value follows the controlled value, so that
  // when the host stops controlling it, the dashboard keeps showing the last
  // controlled value.
  useIsomorphicLayoutEffect(() => {
    const stale = Object.entries(controlled).some(
      ([key, value]) =>
        stableStringify(value) !==
        stableStringify(internal[key as RelativeValuesStateKey])
    );
    if (stale) {
      setInternal((previous) => ({ ...previous, ...controlled }));
    }
    // Only when the controlled values change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlled]);

  const lockedKeys = useMemo(() => {
    const result = new Set<RelativeValuesStateKey>(locked ?? []);
    for (const key of controlledKeys) {
      const hasHandler = !!onStateChange || (key === "view" && !!onTabChange);
      if (!hasHandler) {
        result.add(key);
      }
    }
    return result;
  }, [locked, controlledKeys, onStateChange, onTabChange]);

  // The latest values, for event handlers.
  const latest = useRef({
    onStateChange,
    onTabChange,
    lockedKeys,
    controlledKeys,
  });
  latest.current = { onStateChange, onTabChange, lockedKeys, controlledKeys };

  const dispatch = useCallback(
    (action: RelativeValuesAction, source: DispatchSource) => {
      const current = latest.current;
      const dispatchContext = context.current;
      if (!dispatchContext) {
        return;
      }
      const previous = dispatchBase(dispatchContext);
      const reduced = reduceRelativeValuesState(previous, action, {
        universeClusters: dispatchContext.universeClusters,
        initial: initialRef.current,
      });
      const next = {
        ...(dispatchContext.normalize
          ? normalizeRelativeValuesState(reduced, dispatchContext.normalize)
              .state
          : reduced),
      };
      if (source === "user") {
        for (const key of current.lockedKeys) {
          Object.assign(next, { [key]: previous[key] });
        }
      }
      const keys = changedRelativeValuesStateKeys(previous, next);
      if (keys.length === 0) {
        return;
      }
      const patch: Partial<RelativeValuesState<string>> = {};
      for (const key of keys) {
        if (!current.controlledKeys.has(key)) {
          Object.assign(patch, { [key]: next[key] });
        }
      }
      if (Object.keys(patch).length) {
        setInternal((state) => ({ ...state, ...patch }));
      }
      // Uncontrolled changes apply until the next render. Later dispatches in
      // the same event build on all of `next`: e.g. setUnit then setSort in
      // one click handler, with both keys controlled from the URL, gives a
      // second `next` with both changes (rejected proposals don't outlive
      // the event).
      dispatchContext.effective = { ...dispatchContext.effective, ...patch };
      if (dispatchContext.proposed === undefined) {
        afterEvent(() => {
          dispatchContext.proposed = undefined;
        });
      }
      dispatchContext.proposed = next;
      const { reason, axis } = relativeValuesActionReason(action);
      current.onStateChange?.(next, {
        reason,
        keys,
        ...(axis ? { axis } : {}),
        source,
        previous,
      });
      if (keys.includes("view")) {
        current.onTabChange?.(next.view);
      }
    },
    [context]
  );

  const isLocked = useCallback(
    (key: RelativeValuesStateKey) => lockedKeys.has(key),
    [lockedKeys]
  );

  const forget = useCallback((patch: Partial<RelativeValuesState<string>>) => {
    const { controlledKeys } = latest.current;
    const uncontrolled = Object.fromEntries(
      Object.entries(patch).filter(
        ([key]) => !controlledKeys.has(key as RelativeValuesStateKey)
      )
    );
    if (Object.keys(uncontrolled).length) {
      setInternal((state) => ({ ...state, ...uncontrolled }));
    }
  }, []);

  return { raw, rawKey, isLocked, dispatch, forget };
}
