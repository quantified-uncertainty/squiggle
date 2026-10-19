// Context keys (§4.4): values that when-clauses read, published by the
// component (or module) that owns the state and read with useContextKey,
// built on useSyncExternalStore so menus and the status bar subscribe without
// re-rendering App.
//
// Several publishers may publish the same key: the most recently mounted one
// wins, and when it unmounts the previous one's value shows again.

import { useLayoutEffect, useRef, useSyncExternalStore } from "react";

import type { WhenContext } from "./when.js";

type Layer = { token: number; keys: Record<string, unknown> };

let nextToken = 1;
// Mount order; later layers win.
const layers: Layer[] = [];
const listeners = new Set<() => void>();
let snapshot: WhenContext = {};

function rebuild() {
  const merged: Record<string, unknown> = {};
  for (const layer of layers) Object.assign(merged, layer.keys);
  snapshot = merged;
  for (const cb of [...listeners]) cb();
}

function shallowEqual(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): boolean {
  const ak = Object.keys(a);
  if (ak.length !== Object.keys(b).length) return false;
  return ak.every((k) => k in b && Object.is(a[k], b[k]));
}

// The merged context. The object identity changes only when a value changes.
export function getContext(): WhenContext {
  return snapshot;
}

export function subscribeContext(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

// Non-React publishing (module stores: host, settings, layout, focus). Each
// call with the same `token` replaces that publisher's keys. Returns the token.
export function publishContextKeys(
  keys: Record<string, unknown>,
  token?: number
): number {
  const existing =
    token === undefined ? undefined : layers.find((l) => l.token === token);
  if (existing) {
    if (shallowEqual(existing.keys, keys)) return existing.token;
    existing.keys = { ...keys };
  } else {
    layers.push({ token: token ?? nextToken++, keys: { ...keys } });
  }
  rebuild();
  return existing?.token ?? layers[layers.length - 1].token;
}

// Updates some keys of an existing publisher, keeping the others.
export function patchContextKeys(
  token: number,
  patch: Record<string, unknown>
): void {
  const layer = layers.find((l) => l.token === token);
  if (!layer) throw new Error(`Unknown context publisher ${token}`);
  const next = { ...layer.keys, ...patch };
  if (shallowEqual(layer.keys, next)) return;
  layer.keys = next;
  rebuild();
}

export function unpublishContextKeys(token: number): void {
  const index = layers.findIndex((l) => l.token === token);
  if (index === -1) return;
  layers.splice(index, 1);
  rebuild();
}

export function createContextPublisher(): number {
  const token = nextToken++;
  layers.push({ token, keys: {} });
  return token;
}

// Publishes `keys` while the calling component is mounted. Pass a fresh
// object every render; only changed values notify subscribers.
export function useContextKeys(keys: Record<string, unknown>): void {
  const tokenRef = useRef<number | undefined>(undefined);
  const keysRef = useRef(keys);
  keysRef.current = keys;

  // Register on mount (StrictMode-safe: a remount gets a new token).
  useLayoutEffect(() => {
    const token = createContextPublisher();
    tokenRef.current = token;
    publishContextKeys(keysRef.current, token);
    return () => {
      tokenRef.current = undefined;
      unpublishContextKeys(token);
    };
  }, []);

  useLayoutEffect(() => {
    if (tokenRef.current !== undefined) {
      publishContextKeys(keys, tokenRef.current);
    }
  });
}

export function useContextKey(name: string): unknown {
  return useSyncExternalStore(
    subscribeContext,
    () => snapshot[name],
    () => snapshot[name]
  );
}

// The whole context; re-renders on any change.
export function useWhenContext(): WhenContext {
  return useSyncExternalStore(subscribeContext, getContext, getContext);
}

// For tests.
export function resetContextForTests(): void {
  layers.length = 0;
  rebuild();
}
