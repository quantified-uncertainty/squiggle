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

import { TID } from "../../shared/testIds.js";
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
// (switching files remounts the workspace, switching views unmounts the code
// editor or the Playground), so focus never stays on <body>. For the main
// area that is the same kind of region of the new content, or the other main
// region when the new content has none (the Playground has no code pane, a
// text file no view).
function rescueFocus(previous: HTMLElement, region: FocusRegion | undefined) {
  const prefer = mainRegionOf(previous) ?? region;
  setTimeout(() => {
    if (document.activeElement && document.activeElement !== document.body)
      return;
    if (previous.isConnected) return;
    if (!prefer || prefer === "overlay" || prefer === "menubar") return;
    if (prefer === "editor" || prefer === "view") {
      // An explicit request (after a file or view switch) already handles it.
      if (mainRequest === undefined) {
        void focusMain({ prefer, retryMs: SWITCH_RETRY_MS, whileLost: true });
      }
      return;
    }
    void focusRegion(prefer);
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
    // A focuser may focus something outside its region (the relative values
    // view focuses its toolbar in the editor header), but focus must have
    // landed somewhere: an element that can't take focus leaves it on <body>.
    if (focusIsIn(region) || (result === true && focusLanded())) return true;
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

// How long focus waits for the new content after a file or view switch
// (the file may still be loading, its first run computing, the Playground's
// editor mounting). Any key or pointer input ends the wait.
export const SWITCH_RETRY_MS = 3000;

export type MainRegion = "editor" | "view";

// The pending focusMain() request: a newer one replaces it.
let mainRequest: symbol | undefined;

function focusLanded(): boolean {
  const active = document.activeElement;
  return active !== null && active !== document.body;
}

// The main region an element counts as: an editor (the code pane's, the
// Playground's or the text file's) is "editor", the rest of a view is "view".
function mainRegionOf(el: Element | null): MainRegion | undefined {
  const region = regionOf(el);
  if (region !== "editor" && region !== "view") return undefined;
  return el?.closest(".cm-editor") ? "editor" : region;
}

// One attempt at the main area: the preferred region while it is shown (it
// may still be mounting, so this waits for it rather than taking the other
// one), else the other region.
function tryFocusMain(order: readonly MainRegion[]): "done" | "wait" {
  for (const region of order) {
    if (!isRegionAvailable(region)) continue;
    return tryFocus(region) ? "done" : "wait";
  }
  return "wait";
}

// Focuses the main area: `prefer` (default: the editor or view, whichever
// had focus last; the editor if neither did), or the other one when the
// shown content has no such region (the Playground has no code pane, a text
// file no view). Retries each animation frame for `retryMs`, because the
// content may still be mounting; a newer request or any key or pointer input
// meanwhile ends it, and so does focus landing anywhere with `whileLost`
// (a rescue of focus that fell to <body>). Resolves to false when there's no
// main area (no file).
export function focusMain(
  opts: { retryMs?: number; prefer?: MainRegion; whileLost?: boolean } = {}
): Promise<boolean> {
  const retryMs = opts.retryMs ?? 300;
  const first: MainRegion = opts.prefer ?? lastMainRegion ?? "editor";
  const order: MainRegion[] =
    first === "editor" ? ["editor", "view"] : ["view", "editor"];
  const token = Symbol("focusMain");
  mainRequest = token;
  const start = Date.now();
  const inputBefore = lastInputAt;
  return new Promise((resolve) => {
    const finish = (ok: boolean) => {
      if (mainRequest === token) mainRequest = undefined;
      resolve(ok);
    };
    const attempt = () => {
      if (
        mainRequest !== token ||
        lastInputAt > inputBefore ||
        (opts.whileLost && focusLanded())
      ) {
        finish(false); // replaced, or the user (or Studio) has moved on
        return;
      }
      if (tryFocusMain(order) === "done") {
        finish(true);
        return;
      }
      if (Date.now() - start >= retryMs) {
        // Out of time: whichever main region takes focus now.
        finish(order.some((r) => isRegionAvailable(r) && tryFocus(r)));
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

// Before an action that replaces the main area's content (another file,
// another view): the main region that should have focus afterwards, so that
// switching keeps the region type (§4.5). An editor (also the Playground's)
// gives "editor", the rest of a view "view", <body> the last main region;
// focus anywhere else (the Explorer, the status bar, an overlay) stays where
// it is (undefined).
export function mainFocusTarget(): MainRegion | undefined {
  if (typeof document === "undefined") return undefined;
  const active = document.activeElement;
  if (
    !active ||
    active === document.body ||
    // The start page is what the main area shows without a file.
    active.closest(`[data-testid="${TID.startPage}"]`)
  ) {
    return lastMainRegion ?? "editor";
  }
  return mainRegionOf(active);
}

// The main area now shows the start page (no file): its first button gets
// focus once it renders, unless focus has landed somewhere meanwhile.
export function focusStartPageAfterRender(): void {
  if (typeof requestAnimationFrame !== "function") return;
  requestAnimationFrame(() => {
    if (focusLanded()) return;
    document
      .querySelector<HTMLElement>(
        `[data-testid="${TID.startPage}"] button:not([disabled])`
      )
      ?.focus();
  });
}

// After such an action: focuses `prefer` (or the other main region) of the
// new content once React has rendered it.
export function focusMainAfterRender(prefer: MainRegion | undefined): void {
  if (typeof requestAnimationFrame !== "function") return;
  // Claims the request now, so a rescue of the removed element waits for it.
  const token = Symbol("pending");
  mainRequest = token;
  requestAnimationFrame(() => {
    if (mainRequest !== token) return;
    void focusMain({ prefer, retryMs: SWITCH_RETRY_MS });
  });
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
// When that element is gone, or was <body> (nothing had focus), focus goes to
// the main area instead (§4.5).
export function captureFocus(): () => void {
  const previous = document.activeElement;
  return () => {
    if (
      previous instanceof HTMLElement &&
      previous !== document.body &&
      previous.isConnected
    ) {
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
  mainRequest = undefined;
}
