"use client";
import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useMemo,
} from "react";

import { stableStringify } from "../../state/resolve.js";
import {
  createFormatter,
  defaultResolvedFormat,
  type ResolvedFormat,
  resolveFormat,
} from "./format.js";
import { defaultRelativeValuesLabels } from "./labels.js";
import type {
  RelativeValuesCellDisplay,
  RelativeValuesComponents,
  RelativeValuesControls,
  RelativeValuesDisplay,
  RelativeValuesFormatter,
  RelativeValuesLabels,
  RelativeValuesOptions,
  RelativeValuesPairClick,
  RelativeValuesPlotKind,
  RelativeValuesPresentationProps,
} from "./types.js";

export type ResolvedControls = {
  header: boolean;
  tabs: boolean;
  progress: boolean;
  searchChip: boolean;
  list: {
    toolbar: boolean;
    settings: boolean;
    search: boolean;
    unitPicker: boolean;
    sidebar: boolean;
  };
  grid: {
    toolbar: boolean;
    rowSettings: boolean;
    columnSettings: boolean;
    clusterDiagram: boolean;
    modeControls: boolean;
  };
  plot: { toolbar: boolean; clusterFilter: boolean };
  sortMenu: {
    clusters: boolean;
    sort: boolean;
    sortOptions: readonly string[] | undefined;
  };
};

const controlsWith = (on: boolean): ResolvedControls => ({
  header: on,
  tabs: on,
  progress: on,
  searchChip: on,
  list: {
    toolbar: on,
    settings: on,
    search: on,
    unitPicker: on,
    sidebar: on,
  },
  grid: {
    toolbar: on,
    rowSettings: on,
    columnSettings: on,
    clusterDiagram: on,
    modeControls: on,
  },
  plot: { toolbar: on, clusterFilter: on },
  sortMenu: { clusters: on, sort: on, sortOptions: undefined },
});

export const allControls = controlsWith(true);
const noControls = controlsWith(false);

// `{ ...a, ...b }`, ignoring undefined values in `b`.
function merge<T extends object>(
  base: T,
  overrides: Partial<T> | undefined
): T {
  if (!overrides) {
    return base;
  }
  const result = { ...base };
  for (const key of Object.keys(overrides) as (keyof T)[]) {
    const value = overrides[key];
    if (value !== undefined) {
      result[key] = value as T[keyof T];
    }
  }
  return result;
}

/**
 * `false` turns everything off; `true` turns everything on; undefined keeps
 * `parent`; an object is merged over `parent`.
 */
export function resolveControls(
  controls: boolean | RelativeValuesControls | undefined,
  parent: ResolvedControls = allControls
): ResolvedControls {
  if (controls === undefined) {
    return parent;
  }
  if (typeof controls === "boolean") {
    return controls ? allControls : noControls;
  }
  return {
    header: controls.header ?? parent.header,
    tabs: controls.tabs ?? parent.tabs,
    progress: controls.progress ?? parent.progress,
    searchChip: controls.searchChip ?? parent.searchChip,
    list: merge(parent.list, controls.list),
    grid: merge(parent.grid, controls.grid),
    plot: merge(parent.plot, controls.plot),
    sortMenu: merge(parent.sortMenu, controls.sortMenu),
  };
}

export type ResolvedDisplay = {
  density: "comfortable" | "compact";
  list: {
    groupByCluster: boolean;
    cell: RelativeValuesCellDisplay;
    descriptions: boolean | "auto";
    itemIds: boolean;
    clusterTags: boolean;
    sidebarPosition: "side" | "below";
  };
  grid: {
    cell: RelativeValuesCellDisplay;
    heatmap: boolean;
    cellWidth: number | string;
    groupByCluster: boolean;
  };
  plot: {
    plots: readonly RelativeValuesPlotKind[];
    height: number;
    titles: boolean;
    valueUncertainty: {
      reference: "auto" | "unit" | "average";
      xScale: "log" | "linear";
      yScale: "linear" | "log";
    };
  };
};

export const defaultDisplay: ResolvedDisplay = {
  density: "comfortable",
  list: {
    groupByCluster: true,
    cell: "full",
    descriptions: "auto",
    itemIds: true,
    clusterTags: true,
    sidebarPosition: "side",
  },
  grid: {
    cell: "valueAndUncertainty",
    heatmap: true,
    cellWidth: 140,
    groupByCluster: false,
  },
  plot: {
    plots: ["similarity", "valueUncertainty"],
    height: 450,
    titles: true,
    valueUncertainty: { reference: "auto", xScale: "log", yScale: "linear" },
  },
};

/** Merges `display` field by field over `parent`. */
export function resolveDisplay(
  display: RelativeValuesDisplay | undefined,
  parent: ResolvedDisplay = defaultDisplay
): ResolvedDisplay {
  if (!display) {
    return parent;
  }
  const plot = merge(parent.plot, {
    ...display.plot,
    valueUncertainty: undefined,
  });
  return {
    density: display.density ?? parent.density,
    list: merge(parent.list, display.list),
    grid: merge(parent.grid, display.grid),
    plot: {
      ...plot,
      valueUncertainty: merge(
        parent.plot.valueUncertainty,
        display.plot?.valueUncertainty
      ),
    },
  };
}

export type PresentationOptions = RelativeValuesOptions & {
  onPairClick?: (click: RelativeValuesPairClick) => void;
};

export type Presentation = {
  controls: ResolvedControls;
  components: Partial<RelativeValuesComponents>;
  labels: RelativeValuesLabels;
  format: ResolvedFormat;
  formatter: RelativeValuesFormatter;
  display: ResolvedDisplay;
  options: PresentationOptions;
};

const defaultPresentation: Presentation = {
  controls: allControls,
  components: {},
  labels: defaultRelativeValuesLabels,
  format: defaultResolvedFormat,
  formatter: createFormatter(
    defaultResolvedFormat,
    defaultRelativeValuesLabels
  ),
  display: defaultDisplay,
  options: {},
};

const PresentationContext = createContext<Presentation>(defaultPresentation);

export function usePresentation(): Presentation {
  return useContext(PresentationContext);
}

/** Merges presentation props over the enclosing presentation. */
export const PresentationProvider: FC<
  PropsWithChildren<RelativeValuesPresentationProps>
> = ({
  controls,
  components,
  labels,
  format,
  display,
  getPlaygroundUrl,
  linker,
  sourceId,
  onItemClick,
  renderItemName,
  onPairClick,
  children,
}) => {
  const parent = usePresentation();
  // Plain-JSON props are compared by value, so inline objects don't
  // re-render the views.
  const controlsKey = stableStringify(controls ?? null);
  const displayKey = stableStringify(display ?? null);
  const formatKey = stableStringify(format ?? null);
  const formatNumber = format?.formatNumber;

  const value = useMemo((): Presentation => {
    const mergedLabels = labels ? merge(parent.labels, labels) : parent.labels;
    const resolvedFormat = resolveFormat(format, parent.format);
    return {
      controls: resolveControls(controls, parent.controls),
      components: components
        ? merge(parent.components, components)
        : parent.components,
      labels: mergedLabels,
      format: resolvedFormat,
      formatter: createFormatter(resolvedFormat, mergedLabels),
      display: resolveDisplay(display, parent.display),
      options: merge(parent.options, {
        getPlaygroundUrl,
        linker,
        sourceId,
        onItemClick,
        renderItemName,
        onPairClick,
      }),
    };
    // Compared by value: `controls`, `display`, `format` (except
    // `formatNumber`).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    parent,
    controlsKey,
    displayKey,
    formatKey,
    formatNumber,
    labels,
    components,
    getPlaygroundUrl,
    linker,
    sourceId,
    onItemClick,
    renderItemName,
    onPairClick,
  ]);

  return (
    <PresentationContext.Provider value={value}>
      {children}
    </PresentationContext.Provider>
  );
};
