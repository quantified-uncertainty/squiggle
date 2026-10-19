import { OutputView } from "./OutputView.js";
import { SplitView } from "./SplitView.js";
import type { StudioView } from "./types.js";

export type {
  StudioRunOutput,
  StudioView,
  StudioViewAvailabilityArgs,
  StudioViewContext,
} from "./types.js";

export const splitView: StudioView = {
  id: "split",
  label: "Split",
  isAvailable: () => true,
  render: (context) => <SplitView context={context} />,
};

export const outputView: StudioView = {
  id: "output",
  label: "Output",
  isAvailable: () => true,
  render: (context) => <OutputView context={context} />,
};

const views: StudioView[] = [splitView, outputView];

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

export const DEFAULT_VIEW_ID = splitView.id;
