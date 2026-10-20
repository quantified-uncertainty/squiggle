// The shown file's latest run, published by FileWorkspace (WP5) and read by
// the status bar (WP2), Copy for Agent and window.squiggleStudio (WP8).

import { useSyncExternalStore } from "react";

import type { SqModuleOutput } from "@quri/squiggle-lang";

export type ActiveRun = {
  path: string;
  status: "running" | "ok" | "error" | "not-run";
  ms?: number;
  executionId: number;
  errors: Array<{
    kind: string;
    message: string;
    location?: { source: string; line: number; column: number };
  }>;
  output?: SqModuleOutput;
  sources?: ReadonlyMap<string, string>;
};

let current: ActiveRun | undefined;
const listeners = new Set<() => void>();

export function publishActiveRun(run: ActiveRun | undefined): void {
  if (current === run) return;
  current = run;
  for (const cb of [...listeners]) cb();
}

export function getActiveRun(): ActiveRun | undefined {
  return current;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useActiveRun(): ActiveRun | undefined {
  return useSyncExternalStore(subscribe, getActiveRun, getActiveRun);
}
