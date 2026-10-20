import type { ReactNode } from "react";

import type { Simulation } from "@quri/squiggle-components";
import type {
  SqLinker,
  SqLocation,
  SqModuleOutput,
  SqProject,
  SqValuePath,
} from "@quri/squiggle-lang";

import type { ViewState } from "../../shared/viewState.js";

// The latest run of the active file, computed by Studio (independently of the
// playground's own run in the Split view).
export type StudioRunOutput = {
  sourceId: string; // root-relative path of the file, e.g. "models/main.squiggle"
  output: SqModuleOutput; // result, bindings, exports of the last finished run
  project: SqProject;
  isStale: boolean; // true while a newer run (for newer code) is in progress
  executionId: number; // increments with every finished run
  simulation: Simulation; // same data in the shape squiggle-components expects
};

export type StudioViewAvailabilityArgs = {
  filePath: string;
  runOutput: StudioRunOutput | undefined;
};

export type StudioViewContext = {
  filePath: string;
  code: string; // current editor buffer (may contain unsaved edits)
  runOutput: StudioRunOutput | undefined;
  linker: SqLinker; // resolves ./relative and hub:owner/slug imports
  // `${path}:${editorEpoch}:${externalRevision}`: changes whenever an
  // uncontrolled editor must be remounted because the code was replaced from
  // outside (the Playground uses it as a React `key`).
  editorKey: string;
  setCode: (code: string) => void; // update the buffer (marks the file dirty)
  openFile: (path: string) => void; // open another file in Studio
  embed: boolean; // true in chrome-less mode (`?embed=1`, used by `render`)
  // The URL's initial state for this file (authoritative in embed mode;
  // outside it, applied once). Replaces the session-wide URL lock (#17).
  initial?: ViewState;
  variable?: string; // embed only: `?variable=name` shows only this variable
  // Shows a location in the code pane (opening it if hidden).
  revealInCode: (location: SqLocation, focus: boolean) => void;
  // A view registers how to reveal a value (⇧⌥V, revealInOutput). Returns an
  // unregister function.
  registerReveal: (fn: (path: SqValuePath) => void) => () => void;
};

// A per-file view, shown as a tab in the view bar ("Split", "Output", ...).
// Register additional views with `registerStudioView` in views/index.ts.
export type StudioView = {
  id: string; // stable id; persisted in localStorage and usable as `?view=`
  label: string;
  // Hidden views don't get a tab. Called on every render; keep it cheap.
  isAvailable: (args: StudioViewAvailabilityArgs) => boolean;
  render: (context: StudioViewContext) => ReactNode;
  // Views with their own code editor (e.g. the playground) are shown without
  // Studio's code pane.
  hasOwnEditor?: boolean;
  // The view's own controls, rendered into the editor header (Output's
  // Cards/List, RV's spec picker and List/Grid/Plot).
  renderToolbar?: (context: StudioViewContext) => ReactNode;
};
