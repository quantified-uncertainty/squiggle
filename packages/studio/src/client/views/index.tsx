import { outputView } from "./OutputView.js";
import { relativeValuesView } from "./RelativeValuesView.js";
import { splitView } from "./SplitView.js";
import type { StudioView } from "./types.js";

export type {
  StudioRunOutput,
  StudioView,
  StudioViewAvailabilityArgs,
  StudioViewContext,
} from "./types.js";

// Each view module defines its own StudioView object (so a view's
// renderToolbar lives next to it).
export { outputView, relativeValuesView, splitView };

// In switcher order: Output, Relative values, Playground.
const views: StudioView[] = [outputView, relativeValuesView, splitView];

// Adds a per-file view. Call before the app renders (e.g. in main.tsx).
// Registering a view with an existing id replaces it.
export function registerStudioView(view: StudioView): void {
  const index = views.findIndex((v) => v.id === view.id);
  if (index === -1) views.push(view);
  else views[index] = view;
}

export function getStudioViews(): readonly StudioView[] {
  return views;
}

export const DEFAULT_VIEW_ID = outputView.id;
