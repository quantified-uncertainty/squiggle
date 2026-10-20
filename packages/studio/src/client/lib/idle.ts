// The idle signal for agents, the e2e harness and `render` (§6.5), and the
// state attributes on <html>.
//
// Idle means: nothing reports busy (WP4: the tree, file loads and saves; WP5:
// runs; WP6: RV computing), no view is marked `data-studio-ready="0"`, no
// `[data-rv-computing]`, `document.fonts.ready`, then two animation frames
// (canvases painted).
//
// <html> attributes: data-studio-host (web|electron), data-studio-idle (1|0),
// and the ones callers set with useHtmlState: data-studio-active-file,
// data-studio-view, data-studio-run (running|ok|error|none),
// data-studio-execution-id, data-studio-disk-hash, data-studio-dirty (0|1).

import { useLayoutEffect, useRef } from "react";

import { host } from "./host.js";

const busy = new Map<string, number>(); // key → count of reporters
const listeners = new Set<() => void>();
let observer: MutationObserver | undefined;
let idleAttr: string | undefined;

function notify() {
  updateIdleAttr();
  for (const cb of [...listeners]) cb();
}

function domIsSettled(): boolean {
  if (typeof document === "undefined") return true;
  return (
    document.querySelector('[data-studio-ready="0"]') === null &&
    document.querySelector("[data-rv-computing]") === null
  );
}

// Busy reporters and DOM markers only; whenIdle also waits for fonts and two
// frames.
export function isIdleNow(): boolean {
  return busy.size === 0 && domIsSettled();
}

export function busyKeys(): string[] {
  return [...busy.keys()];
}

function updateIdleAttr() {
  if (typeof document === "undefined") return;
  const value = isIdleNow() ? "1" : "0";
  if (value === idleAttr) return;
  idleAttr = value;
  document.documentElement.setAttribute("data-studio-idle", value);
}

function ensureObserver() {
  if (observer || typeof MutationObserver === "undefined") return;
  observer = new MutationObserver(() => notify());
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["data-studio-ready", "data-rv-computing"],
  });
  document.documentElement.setAttribute("data-studio-host", host.kind);
  updateIdleAttr();
}

export function reportBusy(key: string, isBusy: boolean): void {
  const count = busy.get(key) ?? 0;
  if (isBusy) busy.set(key, count + 1);
  else if (count <= 1) busy.delete(key);
  else busy.set(key, count - 1);
  notify();
}

// Reports `key` as busy while `isBusy` is true and the component is mounted.
export function useReportBusy(key: string, isBusy: boolean): void {
  useLayoutEffect(() => {
    if (!isBusy) return;
    reportBusy(key, true);
    return () => reportBusy(key, false);
  }, [key, isBusy]);
}

function frame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function waitForChange(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      listeners.delete(done);
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(done, ms);
    listeners.add(done);
  });
}

// Resolves once Studio is idle (or after `timeoutMs`).
export async function whenIdle(
  timeoutMs = 30_000
): Promise<{ idle: boolean; timedOut: boolean; waitedMs: number }> {
  ensureObserver();
  const start = Date.now();
  const left = () => timeoutMs - (Date.now() - start);
  for (;;) {
    if (isIdleNow()) {
      await document.fonts?.ready;
      await frame();
      await frame();
      if (isIdleNow()) {
        return { idle: true, timedOut: false, waitedMs: Date.now() - start };
      }
    }
    if (left() <= 0) {
      return { idle: false, timedOut: true, waitedMs: Date.now() - start };
    }
    // Busy reporters notify; DOM markers notify through the observer. Poll
    // as a backstop.
    await waitForChange(Math.min(250, left()));
  }
}

export type HtmlStateKey =
  | "active-file"
  | "view"
  | "run"
  | "execution-id"
  | "disk-hash"
  | "dirty";

// Mirrors `attrs` onto <html> as data-studio-<key> while mounted. An
// undefined value removes the attribute.
export function useHtmlState(
  attrs: Partial<Record<HtmlStateKey, string>>
): void {
  const previous = useRef<Partial<Record<HtmlStateKey, string>>>({});
  useLayoutEffect(() => {
    const el = document.documentElement;
    const prev = previous.current;
    for (const key of Object.keys(prev) as HtmlStateKey[]) {
      if (!(key in attrs) || attrs[key] === undefined) {
        el.removeAttribute(`data-studio-${key}`);
      }
    }
    for (const [key, value] of Object.entries(attrs)) {
      if (value === undefined) el.removeAttribute(`data-studio-${key}`);
      else el.setAttribute(`data-studio-${key}`, value);
    }
    previous.current = { ...attrs };
  });
  useLayoutEffect(
    () => () => {
      for (const key of Object.keys(previous.current)) {
        document.documentElement.removeAttribute(`data-studio-${key}`);
      }
    },
    []
  );
}

// Starts the DOM observer and sets data-studio-host / data-studio-idle.
export function installIdleTracking(): void {
  ensureObserver();
}
