"use client";
import clsx from "clsx";
import { FC, memo, ReactElement, ReactNode, useMemo } from "react";

import {
  Bars4Icon,
  IconProps,
  ScatterPlotIcon,
  TableCellsIcon,
} from "@quri/ui";

import type { RelativeValuesTab } from "../state/types.js";
import type { RelativeValuesDefinition } from "../types.js";
import type { ModelEvaluator } from "../values/ModelEvaluator.js";
import {
  type CoreProviderProps,
  RelativeValuesCoreProvider,
  useCore,
  useProgress,
} from "./host/core.js";
import { usePresentation } from "./host/presentation.js";
import type { SourceProps } from "./host/source.js";
import type { ConsumerRequirement } from "./host/requirements.js";
import {
  DefaultError,
  DefaultProgress,
  DefaultTabBar,
  renderSlot,
} from "./host/slots.js";
import type {
  RelativeValuesControls,
  RelativeValuesCustomTab,
  RelativeValuesFrameProps,
  RelativeValuesHostProps,
  RelativeValuesTabConfig,
  RelativeValuesTabContext,
} from "./host/types.js";
import { RelativeValuesRoot } from "./RelativeValuesRoot.js";
import { useRelativeValuesConsumer } from "./useRelativeValues.js";
import { GridView } from "./views/GridView/index.js";
import { ListView } from "./views/ListView/index.js";
import { PlotView } from "./views/PlotView/index.js";
import { ViewStatus } from "./views/ViewStatus.js";

export type {
  ClusterOverrides,
  RelativeValuesCustomTab,
  RelativeValuesTabConfig,
  RelativeValuesTabContext,
} from "./host/types.js";
export type { RelativeValuesTab } from "../state/types.js";

export const relativeValuesTabs: {
  id: RelativeValuesTab;
  name: string;
  icon: FC<IconProps>;
}[] = [
  { id: "list", name: "List", icon: Bars4Icon },
  { id: "grid", name: "Grid", icon: TableCellsIcon },
  { id: "plot", name: "Plot", icon: ScatterPlotIcon },
];

const tabLabelKeys: Record<
  RelativeValuesTab,
  "tab.list" | "tab.grid" | "tab.plot"
> = {
  list: "tab.list",
  grid: "tab.grid",
  plot: "tab.plot",
};

/**
 * The context for custom tabs and custom views; must be used inside a
 * provider whose pairs are computed. Prefer `useRelativeValues()`.
 */
export function useRelativeValuesTabContext(): RelativeValuesTabContext {
  const rv = useRelativeValuesConsumer(allPairs);
  if (rv.status === "loading" || rv.status === "error") {
    throw new Error(
      rv.status === "error"
        ? rv.error
        : "useRelativeValuesTabContext: the evaluator isn't ready"
    );
  }
  return rv;
}

const allPairs: ConsumerRequirement = { kind: "requires", requires: "all" };

/**
 * A custom tab or view: renders once the pairs that it `requires` (default:
 * all pairs in scope) are computed.
 */
export const CustomTabView: FC<{ tab: RelativeValuesCustomTab }> = ({
  tab,
}) => {
  const core = useCore();
  const requires = tab.requires ?? "all";
  const requirement = useMemo(
    (): ConsumerRequirement => ({ kind: "requires", requires }),
    [requires]
  );
  const progress = useProgress();
  const rv = useRelativeValuesConsumer(requirement, { progress });
  if (rv.status !== "ready") {
    return <ViewStatus controller={rv} />;
  }
  return (
    <div
      className="contents"
      data-rv-part="custom"
      data-rv-view={tab.id}
      data-rv-provider={core.id}
    >
      {tab.render(rv)}
    </div>
  );
};

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

export const RelativeValuesTabButtons: FC<{
  tab: RelativeValuesTab;
  onChange: (tab: RelativeValuesTab) => void;
}> = ({ tab, onChange }) => (
  <DefaultTabBar
    tabs={relativeValuesTabs.map(({ id, name, icon }) => ({
      id,
      label: name,
      icon,
    }))}
    active={tab}
    onChange={(id) => {
      const builtin = relativeValuesTabs.find((t) => t.id === id);
      if (builtin) {
        onChange(builtin.id);
      }
    }}
  />
);

type TabEntry = {
  id: string;
  icon?: FC<IconProps>;
} & (
  | { builtin: RelativeValuesTab; custom?: undefined; label?: undefined }
  | { builtin?: undefined; custom: RelativeValuesCustomTab; label: string }
);

function tabEntries(
  tabs: readonly RelativeValuesTabConfig<string>[]
): TabEntry[] {
  const entries = tabs.map((config): TabEntry => {
    if (typeof config !== "string") {
      return {
        id: config.id,
        label: config.label,
        icon: config.icon,
        custom: config,
      };
    }
    const builtin = relativeValuesTabs.find((t) => t.id === config);
    if (!builtin) {
      throw new Error(`Unknown relative values tab: ${String(config)}`);
    }
    return { id: builtin.id, icon: builtin.icon, builtin: builtin.id };
  });
  if (entries.length === 0) {
    throw new Error("RelativeValuesDashboard needs at least one tab");
  }
  return entries;
}

// Background progress, next to the tab bar.
function useCompactProgress(): ReactNode {
  const core = useCore();
  const progress = useProgress();
  const { components } = usePresentation();
  if (!progress || !(progress.background || core.isStale)) {
    return null;
  }
  return renderSlot(components.Progress, DefaultProgress, {
    progress,
    variant: "compact",
  });
}

const CompactProgress: FC = () => <>{useCompactProgress()}</>;

// The header row with only the progress (no title, no tab bar): shown while
// there's background progress.
const ProgressRow: FC = () => {
  const progress = useCompactProgress();
  return progress ? (
    <div
      data-rv-part="header"
      className="flex flex-none items-center justify-end gap-4"
    >
      {progress}
    </div>
  ) : null;
};

const DashboardFrame: FC<
  {
    tabs: TabEntry[];
    header: ReactNode | undefined;
  } & Omit<RelativeValuesFrameProps, "precompute">
> = ({ tabs, header, className, height, themeClassName }) => {
  const core = useCore();
  const { controls, components, labels } = usePresentation();
  const active = tabs.find((t) => t.id === core.state.view) ?? tabs[0];
  const title = core.snapshot?.definition.title;

  const headerContent = !controls.header ? null : header === undefined ? (
    title ? (
      <div className="font-semibold text-[color:var(--squiggle-rv-text,#374151)]">
        {title}
      </div>
    ) : null
  ) : (
    header
  );
  const showTabs =
    controls.tabs && !core.isLocked("view") && core.status !== "error";
  const fixedHeight = height !== undefined;

  const tabBar = showTabs
    ? renderSlot(components.TabBar, DefaultTabBar, {
        tabs: tabs.map((tab) => ({
          id: tab.id,
          label: tab.custom ? tab.label : labels[tabLabelKeys[tab.builtin]],
          icon: tab.icon,
        })),
        active: active.id,
        onChange: (id: string) =>
          core.dispatch({ type: "setView", view: id }, "user"),
      })
    : null;
  return (
    <RelativeValuesRoot
      className={className}
      style={fixedHeight ? { height } : undefined}
      themeClassName={themeClassName}
    >
      <div className={clsx("flex flex-col gap-4", fixedHeight && "h-full")}>
        {showTabs || headerContent ? (
          <div
            data-rv-part="header"
            className="flex flex-none items-center justify-between gap-4"
          >
            <div>{headerContent}</div>
            <div className="flex items-center gap-4">
              {controls.progress && <CompactProgress />}
              {tabBar}
            </div>
          </div>
        ) : (
          controls.progress && <ProgressRow />
        )}
        <div className={clsx(fixedHeight && "min-h-0 flex-1 overflow-auto")}>
          {core.status === "error" ? (
            renderSlot(components.Error, DefaultError, {
              error: core.error ?? "Error",
            })
          ) : active.custom ? (
            <CustomTabView tab={active.custom} />
          ) : (
            <RelativeValuesTabView tab={active.builtin} />
          )}
        </div>
      </div>
    </RelativeValuesRoot>
  );
};

type DashboardOwnProps<TabId extends string> = {
  // Tabs to show, in order: built-in tab ids and custom tabs. Defaults to
  // `["list", "grid", "plot"]`. Custom tab ids are inferred from here only.
  tabs?: RelativeValuesTabConfig<TabId>[];
  // Controlled tab (= state.view).
  tab?: RelativeValuesTab | NoInfer<TabId>;
  // Uncontrolled initial tab (= defaultState.view); defaults to the first tab.
  initialTab?: RelativeValuesTab | NoInfer<TabId>;
  onTabChange?: (tab: RelativeValuesTab | NoInfer<TabId>) => void;
  // Defaults to true (= controls.tabs). Hide if you render tab buttons
  // yourself.
  showTabs?: boolean;
  // Rendered on the left side of the header row. Defaults to the definition
  // title; null hides it.
  header?: ReactNode;
} & RelativeValuesFrameProps &
  RelativeValuesHostProps<RelativeValuesTab | NoInfer<TabId>>;

export type RelativeValuesDashboardProps<TabId extends string = never> = {
  definition: RelativeValuesDefinition;
  evaluator: ModelEvaluator;
} & DashboardOwnProps<TabId>;

function withShowTabs(
  controls: boolean | RelativeValuesControls | undefined,
  showTabs: boolean | undefined
): boolean | RelativeValuesControls | undefined {
  if (showTabs === undefined || controls === false) {
    return controls;
  }
  if (controls === undefined || controls === true) {
    return showTabs ? controls : { tabs: false };
  }
  return controls.tabs === undefined
    ? { ...controls, tabs: showTabs }
    : controls;
}

/** A dashboard for any source; the public dashboards are typed wrappers. */
export function renderDashboard<TabId extends string>(
  source: SourceProps,
  props: DashboardOwnProps<TabId>
): ReactElement {
  const {
    tabs = relativeValuesTabs.map((t) => t.id),
    tab,
    initialTab,
    onTabChange,
    showTabs,
    header,
    className,
    height,
    themeClassName,
    precompute,
    controls,
    ...hostProps
  } = props;
  const entries = tabEntries(tabs);
  // The generic View (built-in and custom tab ids) is erased below: views
  // are validated at runtime against the tab ids.
  const coreProps = {
    ...hostProps,
    ...source,
    controls: withShowTabs(controls, showTabs),
    views: entries.map((entry) => entry.id),
    tab,
    initialTab,
    onTabChange,
    precompute,
    defaultPrecompute: true,
  } as unknown as CoreProviderProps;
  return (
    <RelativeValuesCoreProvider {...coreProps}>
      <DashboardFrame
        tabs={entries}
        header={header}
        className={className}
        height={height}
        themeClassName={themeClassName}
      />
    </RelativeValuesCoreProvider>
  );
}

/**
 * List / grid / plot dashboard for a definition and an evaluator.
 *
 * (Generic over custom tab ids, so it's a function instead of an `FC`.)
 */
export function RelativeValuesDashboard<TabId extends string = never>({
  definition,
  evaluator,
  ...props
}: RelativeValuesDashboardProps<TabId>): ReactElement {
  return renderDashboard({ definition, evaluator }, props);
}
