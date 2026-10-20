"use client";
import { createContext, FC, ReactNode, useContext } from "react";

import { useCore, useProgress } from "../host/core.js";
import { usePresentation } from "../host/presentation.js";
import {
  DefaultEmpty,
  DefaultError,
  DefaultProgress,
  renderSlot,
} from "../host/slots.js";
import type { RelativeValuesController } from "../host/types.js";

// What a view shows until its pairs are computed (`fallback` of
// RelativeValuesSingleView); default: the Progress slot.
const FallbackContext = createContext<ReactNode | undefined>(undefined);
export const ViewFallbackProvider = FallbackContext.Provider;

const BlockingProgress: FC = () => {
  // Only this component re-renders on progress updates.
  const progress = useProgress();
  const { components } = usePresentation();
  return renderSlot(components.Progress, DefaultProgress, {
    progress,
    variant: "blocking",
  });
};

/** Loading, error and computing states of a view. */
export const ViewStatus: FC<{
  controller: RelativeValuesController<string>;
}> = ({ controller }) => {
  const { components } = usePresentation();
  const fallback = useContext(FallbackContext);
  if (controller.status === "error") {
    return renderSlot(components.Error, DefaultError, {
      error: controller.error,
    });
  }
  if (fallback !== undefined) {
    return <>{fallback}</>;
  }
  return <BlockingProgress />;
};

/** No items to show: the scope is empty, or the filters remove everything. */
export const ViewEmpty: FC<{
  controller: RelativeValuesController<string>;
  view: string;
}> = ({ controller, view }) => {
  const { components } = usePresentation();
  return renderSlot(components.Empty, DefaultEmpty, {
    reason: controller.universe.length === 0 ? "scope" : "filter",
    view,
  });
};

/** "Search: x ×", in views without a search box. */
export const SearchChip: FC = () => {
  const core = useCore();
  const { controls, labels } = usePresentation();
  const search = core.state.search;
  if (!search || !controls.searchChip || core.isLocked("search")) {
    return null;
  }
  return (
    <div
      data-rv-part="search-chip"
      className="inline-flex items-center gap-1 rounded-full bg-[var(--squiggle-rv-panel-bg,#f1f5f9)] py-0.5 pl-2.5 pr-1 text-xs text-[color:var(--squiggle-rv-text,#475569)]"
    >
      <span>{labels["search.chip"](search)}</span>
      <button
        type="button"
        aria-label={labels["search.clear"]}
        className="rounded-full px-1 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
        onClick={() => core.dispatch({ type: "setSearch", search: "" }, "user")}
      >
        ×
      </button>
    </div>
  );
};
