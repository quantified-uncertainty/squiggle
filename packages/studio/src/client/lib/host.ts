// The host the page runs in: a browser tab, or an Electron window whose
// sandboxed preload exposes `window.studioHost` (§3.5).

import type { MenuState, Platform } from "../../shared/commands/index.js";

export type StudioHost = {
  kind: "web" | "electron";
  platform: Platform;
  // Commands chosen in the native menu (Electron). Returns an unsubscribe.
  onCommand(
    cb: (id: string, args?: unknown, viaKey?: boolean) => void
  ): () => void;
  // Enabled, checked and dynamic menu state for the native menu (Electron).
  setMenuState(state: MenuState): void;
};

declare global {
  interface Window {
    studioHost?: Partial<StudioHost>;
  }
}

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "linux";
  const nav = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  const name = nav.userAgentData?.platform || nav.platform || nav.userAgent;
  if (/mac|iphone|ipad|ipod/i.test(name)) return "mac";
  if (/win/i.test(name)) return "win";
  return "linux";
}

function createHost(): StudioHost {
  const injected =
    typeof window === "undefined" ? undefined : window.studioHost;
  const isPlatform = (p: unknown): p is Platform =>
    p === "mac" || p === "win" || p === "linux";
  return {
    kind: injected?.kind === "electron" ? "electron" : "web",
    platform: isPlatform(injected?.platform)
      ? injected.platform
      : detectPlatform(),
    onCommand: (cb) => injected?.onCommand?.(cb) ?? (() => undefined),
    setMenuState: (state) => injected?.setMenuState?.(state),
  };
}

export const host: StudioHost = createHost();

const listeners = new Set<() => void>();

export function subscribeHost(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// For tests: replaces fields of `host` in place, so every module sees the
// change, and republishes the host context keys.
export function overrideHost(patch: Partial<StudioHost>): void {
  Object.assign(host, patch);
  for (const cb of listeners) cb();
}
