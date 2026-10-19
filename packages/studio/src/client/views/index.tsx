import { OutputView } from "./OutputView.js";
import { hasRelativeValues, RelativeValuesView } from "./RelativeValuesView.js";
import { SplitView } from "./SplitView.js";
import type { StudioView } from "./types.js";

export type {
  StudioRunOutput,
  StudioView,
  StudioViewAvailabilityArgs,
  StudioViewContext,
} from "./types.js";

// The full Squiggle playground (its own editor, settings and viewer). The id is
// "split" for compatibility with saved state and `?view=split`.
export const splitView: StudioView = {
  id: "split",
  label: "Playground",
  hasOwnEditor: true,
  isAvailable: () => true,
  render: (context) => <SplitView context={context} />,
};

export const outputView: StudioView = {
  id: "output",
  label: "Output",
  isAvailable: () => true,
  render: (context) => <OutputView context={context} />,
};

// Shown for files with a top-level relative values spec (see
// @quri/squiggle-relative-values). The dashboard has its own List / Grid / Plot
// tabs.
export const relativeValuesView: StudioView = {
  id: "relative-values",
  label: "Relative values",
  isAvailable: ({ filePath, runOutput }) =>
    hasRelativeValues(filePath, runOutput),
  render: (context) => <RelativeValuesView context={context} />,
};

const views: StudioView[] = [outputView, relativeValuesView, splitView];

// Adds a per-file view tab. Call before the app renders (e.g. in main.tsx).
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
