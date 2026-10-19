"use client";
import clsx from "clsx";
import {
  CSSProperties,
  FC,
  memo,
  ReactElement,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Bars4Icon,
  IconProps,
  ScatterPlotIcon,
  StyledTab,
  TableCellsIcon,
} from "@quri/ui";

import { Clusters, Item, RelativeValuesDefinition } from "../types.js";
import { ComputeProgress, ModelEvaluator } from "../values/ModelEvaluator.js";
import { RelativeValuesRoot } from "./RelativeValuesRoot.js";
import { useRelativeValuesComputation } from "./useRelativeValuesComputation.js";
import { GridView } from "./views/GridView/index.js";
import { useFilteredItems, useSortedItems } from "./views/hooks/index.js";
import { ListView } from "./views/ListView/index.js";
import { PlotView } from "./views/PlotView/index.js";
import {
  RelativeValuesOptions,
  RelativeValuesProvider,
  useDefinitionClusters,
  useRelativeValuesContext,
} from "./views/RelativeValuesProvider.js";

// Built-in tabs.
export type RelativeValuesTab = "list" | "grid" | "plot";

export const relativeValuesTabs: {
  id: RelativeValuesTab;
  name: string;
  icon: FC<IconProps>;
}[] = [
  { id: "list", name: "List", icon: Bars4Icon },
  { id: "grid", name: "Grid", icon: TableCellsIcon },
  { id: "plot", name: "Plot", icon: ScatterPlotIcon },
];

/**
 * What custom tabs get to render.
 */
export type RelativeValuesTabContext = {
  definition: RelativeValuesDefinition;
  // All pairs of items are computed (cached) by the time a custom tab renders,
  // so `evaluator.compare(id1, id2)` is cheap.
  evaluator: ModelEvaluator;
  // Items that pass the cluster filter, in the selected sort order (both are
  // the "rows" settings of the grid view; render `<ClusterFilter axis="rows" />`
  // to let users change the filter).
  items: Item[];
  clusters: Clusters;
};

export type RelativeValuesCustomTab<Id extends string = string> = {
  id: Id;
  label: string;
  icon?: FC<IconProps>;
  render: (context: RelativeValuesTabContext) => ReactNode;
};

// A built-in tab id or a custom tab.
export type RelativeValuesTabConfig<Id extends string = string> =
  RelativeValuesTab | RelativeValuesCustomTab<Id>;

// Overrides for the definition's clusters, by cluster id.
export type ClusterOverrides = Record<
  string,
  { name?: string; color?: string }
>;

/**
 * The context for custom tabs; must be used inside `RelativeValuesProvider`.
 */
export function useRelativeValuesTabContext(): RelativeValuesTabContext {
  const { evaluator, definition, axisConfig } = useRelativeValuesContext();
  const clusters = useDefinitionClusters();
  const rowItems = useFilteredItems({
    items: definition.items,
    config: axisConfig.rows,
  });
  const columnItems = useFilteredItems({
    items: definition.items,
    config: axisConfig.columns,
  });
  const items = useSortedItems({
    items: rowItems,
    config: axisConfig.rows,
    model: evaluator,
    otherDimensionItems: columnItems,
  });
  return { definition, evaluator, items, clusters };
}

// Memoized, so that progress updates don't re-render the view.
const CustomTabView: FC<{ tab: RelativeValuesCustomTab }> = memo(
  function CustomTabView({ tab }) {
    const context = useRelativeValuesTabContext();
    return <>{tab.render(context)}</>;
  }
);

export const RelativeValuesTabView: FC<{ tab: RelativeValuesTab }> = memo(
  function RelativeValuesTabView({ tab }) {
    switch (tab) {
      case "list":
        return <ListView />;
      case "grid":
        return <GridView />;
      case "plot":
        return <PlotView />;
    }
  }
);

type TabButton = { id: string; name: string; icon?: FC<IconProps> };

const TabButtons: FC<{
  tabs: TabButton[];
  tab: string;
  onChange: (tab: string) => void;
}> = ({ tabs, tab, onChange }) => (
  <StyledTab.ListDiv>
    {tabs.map(({ id, name, icon }) => (
      <button
        key={id}
        type="button"
        className="flex"
        onClick={() => onChange(id)}
      >
        <StyledTab.Button name={name} icon={icon} isSelected={tab === id} />
      </button>
    ))}
  </StyledTab.ListDiv>
);

export const RelativeValuesTabButtons: FC<{
  tab: RelativeValuesTab;
  onChange: (tab: RelativeValuesTab) => void;
}> = ({ tab, onChange }) => (
  <TabButtons
    tabs={relativeValuesTabs}
    tab={tab}
    onChange={(id) => {
      const builtin = relativeValuesTabs.find((t) => t.id === id);
      if (builtin) {
        onChange(builtin.id);
      }
    }}
  />
);

/**
 * Progress of the background computation of pairs. Marked with
 * `data-rv-computing`, so that tests and screenshot tools can wait for it to
 * disappear.
 */
const ComputeProgressBar: FC<{
  progress: ComputeProgress | undefined;
  compact?: boolean;
}> = ({ progress, compact }) => {
  // Don't flash the full progress bar for quick computations.
  const [visible, setVisible] = useState(!!compact);
  useEffect(() => {
    const timeout = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(timeout);
  }, []);
  const fraction =
    progress && progress.total > 0 ? progress.done / progress.total : 0;
  return (
    <div
      data-rv-computing=""
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={progress?.total ?? 0}
      aria-valuenow={progress?.done ?? 0}
      aria-label="Computing comparisons"
      className={clsx(
        "flex flex-col gap-1.5",
        compact ? "w-32" : "mx-auto w-full max-w-sm py-16",
        !visible && "invisible"
      )}
    >
      <div
        className={clsx(
          "flex justify-between gap-2 text-slate-500",
          compact ? "text-xs" : "text-sm"
        )}
      >
        <span>{compact ? "Computing…" : "Computing comparisons…"}</span>
        {progress && (
          <span className="tabular-nums">
            {compact
              ? `${Math.floor(fraction * 100)}%`
              : `${progress.done.toLocaleString()} / ${progress.total.toLocaleString()}`}
          </span>
        )}
      </div>
      <div
        className={clsx(
          "overflow-hidden rounded-full bg-slate-200",
          compact ? "h-1" : "h-1.5"
        )}
      >
        <div
          className="h-full rounded-full bg-slate-500 transition-[width]"
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
    </div>
  );
};

function applyClusterOverrides(
  definition: RelativeValuesDefinition,
  overrides: ClusterOverrides | undefined
): RelativeValuesDefinition {
  if (!overrides) {
    return definition;
  }
  return {
    ...definition,
    clusters: definition.clusters.map((cluster) => {
      const override = overrides[cluster.id];
      return override
        ? {
            ...cluster,
            name: override.name ?? cluster.name,
            color: override.color ?? cluster.color,
          }
        : cluster;
    }),
  };
}

export type RelativeValuesDashboardProps<TabId extends string = never> = {
  definition: RelativeValuesDefinition;
  evaluator: ModelEvaluator;
  // Tabs to show, in order: built-in tab ids and custom tabs. Defaults to
  // `["list", "grid", "plot"]`.
  tabs?: RelativeValuesTabConfig<TabId>[];
  // Controlled mode; if set, `initialTab` is ignored.
  tab?: RelativeValuesTab | TabId;
  // Uncontrolled mode; defaults to the first tab.
  initialTab?: RelativeValuesTab | TabId;
  onTabChange?: (tab: RelativeValuesTab | TabId) => void;
  // Defaults to true. Hide if you render tab buttons yourself.
  showTabs?: boolean;
  // Rendered on the left side of the header row. Defaults to the definition title.
  header?: ReactNode;
  // Class name of the outer element.
  className?: string;
  // Height of the dashboard, e.g. `600` or `"100%"` (to fill a parent with a
  // definite height). The tab content scrolls inside. By default, the
  // dashboard grows with its content.
  height?: CSSProperties["height"];
  // Override cluster names and colors from the definition, by cluster id.
  clusterOverrides?: ClusterOverrides;
  // Compute pairs asynchronously, with a progress bar, before rendering a
  // view (and then the pairs for other views, in the background). Defaults to
  // true; if false, views compute pairs synchronously while rendering, which
  // can freeze the page for large models.
  precompute?: boolean;
} & RelativeValuesOptions;

/**
 * List / grid / plot dashboard for a definition and an evaluator.
 *
 * (Generic over custom tab ids, so it's a function instead of an `FC`.)
 */
export function RelativeValuesDashboard<TabId extends string = never>({
  definition: originalDefinition,
  evaluator,
  tabs = relativeValuesTabs.map((t) => t.id),
  tab: controlledTab,
  initialTab,
  onTabChange,
  showTabs = true,
  header,
  className,
  height,
  clusterOverrides,
  precompute = true,
  ...options
}: RelativeValuesDashboardProps<TabId>): ReactElement {
  type TabIdOrBuiltin = RelativeValuesTab | TabId;

  const clusterOverridesKey = JSON.stringify(clusterOverrides ?? null);
  const definition = useMemo(
    () => applyClusterOverrides(originalDefinition, clusterOverrides),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [originalDefinition, clusterOverridesKey]
  );

  type TabEntry = TabButton &
    (
      | { id: RelativeValuesTab; custom?: undefined }
      | { id: TabId; custom: RelativeValuesCustomTab<TabId> }
    );

  const tabConfigs = tabs.map((config): TabEntry => {
    if (typeof config !== "string") {
      return {
        id: config.id,
        name: config.label,
        icon: config.icon,
        custom: config,
      };
    }
    const builtin = relativeValuesTabs.find((t) => t.id === config);
    if (!builtin) {
      throw new Error(`Unknown relative values tab: ${config}`);
    }
    return builtin;
  });
  if (tabConfigs.length === 0) {
    throw new Error("RelativeValuesDashboard needs at least one tab");
  }

  const [uncontrolledTab, setUncontrolledTab] = useState<TabIdOrBuiltin>(
    initialTab ?? tabConfigs[0].id
  );
  const requestedTab = controlledTab ?? uncontrolledTab;
  const activeTab: TabEntry =
    tabConfigs.find((t) => t.id === requestedTab) ?? tabConfigs[0];

  const changeTab = (newTab: TabIdOrBuiltin) => {
    setUncontrolledTab(newTab);
    onTabChange?.(newTab);
  };

  const computation = useRelativeValuesComputation({
    definition,
    evaluator,
    scope: activeTab.id === "list" ? "list" : "all",
    enabled: precompute,
  });

  const headerContent =
    header === undefined ? (
      <div className="font-semibold text-gray-700">{definition.title}</div>
    ) : (
      header
    );

  const fixedHeight = height !== undefined;
  const { ready } = computation;
  const showCompactProgress = !!ready && computation.progress !== undefined;

  const body = (
    <div className={clsx("flex flex-col gap-4", fixedHeight && "h-full")}>
      {(showTabs || headerContent || showCompactProgress) && (
        <div className="flex flex-none items-center justify-between gap-4">
          <div>{headerContent}</div>
          <div className="flex items-center gap-4">
            {showCompactProgress && (
              <ComputeProgressBar progress={computation.progress} compact />
            )}
            {showTabs && (
              <TabButtons
                tabs={tabConfigs}
                tab={activeTab.id}
                onChange={(id) => {
                  const found = tabConfigs.find((t) => t.id === id);
                  if (found) {
                    changeTab(found.id);
                  }
                }}
              />
            )}
          </div>
        </div>
      )}
      <div className={clsx(fixedHeight && "min-h-0 flex-1 overflow-auto")}>
        {computation.error !== undefined ? (
          <div className="text-sm text-red-700">{computation.error}</div>
        ) : ready ? (
          activeTab.custom ? (
            <CustomTabView tab={activeTab.custom} />
          ) : (
            <RelativeValuesTabView tab={activeTab.id} />
          )
        ) : (
          <ComputeProgressBar progress={computation.progress} />
        )}
      </div>
    </div>
  );

  return (
    <RelativeValuesRoot
      className={className}
      style={fixedHeight ? { height } : undefined}
    >
      <RelativeValuesProvider
        definition={ready?.definition ?? definition}
        evaluator={ready?.evaluator ?? evaluator}
        {...options}
      >
        {body}
      </RelativeValuesProvider>
    </RelativeValuesRoot>
  );
}
