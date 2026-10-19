// The focus model (§4.5). Each region's root element carries
// `data-studio-region="<region>"`. One focusin listener records the current
// region, the last focused element per region and the last main region
// (editor or view); one pointerdown + keydown listener records the last user
// input (Follow's busy gate reads it). Publishes the context keys
// focusRegion, editorTextFocus, textInputFocus, filesExplorerFocus and
// overlayOpen.
//
// A region that is mounted but hidden (a collapsed code pane, a hidden
// Explorer kept in the DOM) must carry the `hidden` attribute (or sit inside
// an element that has it) or `data-region-hidden="true"`, so F6 skips it.

import { useLayoutEffect } from "react";

import { createContextPublisher, patchContextKeys } from "./context.js";

export type FocusRegion =
  | "menubar"
  | "tree"
  | "editor"
  | "view"
  | "statusbar"
  | "overlay";

export type FocusRegionKey = FocusRegion | "none";

// The F6 cycle; the menubar and overlays are not part of it.
export const F6_ORDER: readonly FocusRegion[] = [
  "tree",
  "editor",
  "view",
  "statusbar",
];

const REGION_ATTR = "data-studio-region";
const MAIN_REGIONS = new Set<FocusRegion>(["editor", "view"]);

type Focuser = () => boolean | void;

const focusers = new Map<FocusRegion, Focuser[]>();
const lastFocused = new Map<FocusRegion, WeakRef<HTMLElement>>();
let currentRegion: FocusRegionKey = "none";
let lastMainRegion: "editor" | "view" | undefined;
let lastInputAt = 0;
let overlayCount = 0;
let publisher: number | undefined;

function isRegion(value: string | null | undefined): value is FocusRegion {
  return (
    value === "menubar" ||
    value === "tree" ||
    value === "editor" ||
    value === "view" ||
    value === "statusbar" ||
    value === "overlay"
  );
}

function regionOf(el: Element | null): FocusRegion | undefined {
  const root = el?.closest(`[${REGION_ATTR}]`);
  const value = root?.getAttribute(REGION_ATTR);
  return isRegion(value) ? value : undefined;
}

function isTextInput(el: Element | null): boolean {
  if (!el || el.closest(".cm-editor")) return false;
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
    return true;
  }
  if (el instanceof HTMLInputElement) {
    return ![
      "button",
      "checkbox",
      "radio",
      "submit",
      "reset",
      "range",
      "color",
      "file",
      "image",
    ].includes(el.type);
  }
  return el instanceof HTMLElement && el.isContentEditable;
}

function publish() {
  const active =
    typeof document === "undefined" ? null : document.activeElement;
  const editorTextFocus = Boolean(active?.closest(".cm-editor"));
  const textInputFocus = isTextInput(active);
  const region = currentRegion;
  const keys = {
    focusRegion: region,
    editorTextFocus,
    textInputFocus,
    filesExplorerFocus: region === "tree" && !textInputFocus,
    overlayOpen: overlayCount > 0,
  };
  if (publisher === undefined) publisher = createContextPublisher();
  patchContextKeys(publisher, keys);
}

function recordFocus(target: Element | null) {
  const region = regionOf(target);
  currentRegion = region ?? "none";
  if (region && target instanceof HTMLElement) {
    lastFocused.set(region, new WeakRef(target));
    if (MAIN_REGIONS.has(region)) lastMainRegion = region as "editor" | "view";
  }
  publish();
}

// Re-focus a region of the same type when the focused element was removed
// (switching files remounts the workspace), so focus never stays on <body>.
function rescueFocus(previous: HTMLElement, region: FocusRegion | undefined) {
  setTimeout(() => {
    if (document.activeElement && document.activeElement !== document.body)
      return;
    if (previous.isConnected) return;
    if (!region || region === "overlay" || region === "menubar") return;
    void focusRegion(region);
  }, 0);
}

export function installFocusTracking(): () => void {
  const onFocusIn = (e: FocusEvent) => recordFocus(e.target as Element | null);
  const onFocusOut = (e: FocusEvent) => {
    const target = e.target;
    const region = target instanceof Element ? regionOf(target) : undefined;
    if (e.relatedTarget === null) {
      // Focus left to <body> or another window: recompute once it settles.
      setTimeout(() => recordFocus(document.activeElement), 0);
      if (target instanceof HTMLElement) rescueFocus(target, region);
    }
  };
  const onInput = () => {
    lastInputAt = Date.now();
  };
  document.addEventListener("focusin", onFocusIn, true);
  document.addEventListener("focusout", onFocusOut, true);
  window.addEventListener("pointerdown", onInput, true);
  window.addEventListener("keydown", onInput, true);
  recordFocus(document.activeElement);
  return () => {
    document.removeEventListener("focusin", onFocusIn, true);
    document.removeEventListener("focusout", onFocusOut, true);
    window.removeEventListener("pointerdown", onInput, true);
    window.removeEventListener("keydown", onInput, true);
  };
}

// Registers how to focus a region (e.g. the tree container, the code pane's
// CodeEditorHandle.focus()). Return false when it couldn't focus yet (not
// mounted); focusRegion then retries. The last registered focuser wins.
export function registerFocuser(region: FocusRegion, fn: Focuser): () => void {
  const list = focusers.get(region) ?? [];
  list.push(fn);
  focusers.set(region, list);
  return () => {
    const current = focusers.get(region);
    if (!current) return;
    const index = current.lastIndexOf(fn);
    if (index !== -1) current.splice(index, 1);
  };
}

export function useFocuser(region: FocusRegion, fn: Focuser): void {
  useLayoutEffect(() => registerFocuser(region, fn), [region, fn]);
}

function regionElements(region: FocusRegion): HTMLElement[] {
  return [
    ...document.querySelectorAll<HTMLElement>(`[${REGION_ATTR}="${region}"]`),
  ];
}

function isShown(el: HTMLElement): boolean {
  if (!el.isConnected) return false;
  if (el.closest("[hidden]") || el.closest('[data-region-hidden="true"]')) {
    return false;
  }
  const check = (el as HTMLElement & { checkVisibility?: () => boolean })
    .checkVisibility;
  return typeof check === "function" ? check.call(el) : true;
}

// Whether a region is present and visible (hidden or absent regions are
// skipped by F6).
export function isRegionAvailable(region: FocusRegion): boolean {
  return regionElements(region).some(isShown);
}

function focusIsIn(region: FocusRegion): boolean {
  return regionOf(document.activeElement) === region;
}

function tryFocus(region: FocusRegion): boolean {
  const list = focusers.get(region);
  const focuser = list?.[list.length - 1];
  if (focuser) {
    const result = focuser();
    if (result === false) return false;
    if (result === true || focusIsIn(region)) return true;
  }
  // Fallbacks: the last focused element still in the region, then the
  // region root itself if it is focusable, then its first focusable element.
  const last = lastFocused.get(region)?.deref();
  if (last?.isConnected && isShown(last)) {
    last.focus();
    if (focusIsIn(region)) return true;
  }
  const root = regionElements(region).find(isShown);
  if (!root) return false;
  if (root.tabIndex >= 0 || root.hasAttribute("tabindex")) {
    root.focus();
    if (focusIsIn(region)) return true;
  }
  const first = root.querySelector<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
  );
  first?.focus();
  return focusIsIn(region);
}

// Focuses a region, retrying each animation frame for up to `retryMs`
// (the file workspace remounts on file switches). Resolves to whether focus
// landed in the region.
export function focusRegion(
  region: FocusRegion,
  opts: { retryMs?: number } = {}
): Promise<boolean> {
  const retryMs = opts.retryMs ?? 300;
  const start = Date.now();
  return new Promise((resolve) => {
    const attempt = () => {
      if (tryFocus(region)) {
        resolve(true);
        return;
      }
      if (Date.now() - start >= retryMs) {
        resolve(false);
        return;
      }
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(attempt);
      } else {
        setTimeout(attempt, 16);
      }
    };
    attempt();
  });
}

// Focuses the editor or view, whichever had focus last (the editor if
// neither did). Resolves to false when there's no main area (no file).
export async function focusMain(
  opts: { retryMs?: number } = {}
): Promise<boolean> {
  const first = lastMainRegion ?? "editor";
  const second = first === "editor" ? "view" : "editor";
  if (isRegionAvailable(first) && (await focusRegion(first, opts))) return true;
  if (
    isRegionAvailable(second) &&
    (await focusRegion(second, { retryMs: 0 }))
  ) {
    return true;
  }
  return focusRegion(first, opts);
}

export function getFocusRegion(): FocusRegionKey {
  return currentRegion;
}

export function getLastMainRegion(): "editor" | "view" | undefined {
  return lastMainRegion;
}

// F6 / ⇧F6: the next available region in tree → editor → view → statusbar.
export async function focusNextPart(direction: 1 | -1): Promise<boolean> {
  const available = F6_ORDER.filter(isRegionAvailable);
  if (!available.length) return false;
  const index = F6_ORDER.indexOf(currentRegion as FocusRegion);
  let target: FocusRegion | undefined;
  if (index === -1) {
    target = direction === 1 ? available[0] : available[available.length - 1];
  } else {
    for (let step = 1; step <= F6_ORDER.length; step++) {
      const candidate =
        F6_ORDER[
          (index + direction * step + F6_ORDER.length * 2) % F6_ORDER.length
        ];
      if (available.includes(candidate)) {
        target = candidate;
        break;
      }
    }
  }
  return target ? focusRegion(target, { retryMs: 0 }) : false;
}

// The time of the last key or pointer input, in ms since epoch.
export function lastUserInputAt(): number {
  return lastInputAt;
}

// Marks an overlay (QuickPick, switcher, sheet, modal) as open while `open`
// is true: the dispatcher then only prevents defaults for Studio keys.
export function useOverlay(open: boolean): void {
  useLayoutEffect(() => {
    if (!open) return;
    overlayCount++;
    publish();
    return () => {
      overlayCount--;
      publish();
    };
  }, [open]);
}

// Remembers the focused element and returns a function that restores it
// (overlays and menus call it when they close).
export function captureFocus(): () => void {
  const previous = document.activeElement;
  return () => {
    if (previous instanceof HTMLElement && previous.isConnected) {
      previous.focus();
    } else {
      void focusMain();
    }
  };
}

// For tests.
export function resetFocusForTests(): void {
  focusers.clear();
  lastFocused.clear();
  currentRegion = "none";
  lastMainRegion = undefined;
  overlayCount = 0;
  lastInputAt = 0;
  publisher = undefined;
}
