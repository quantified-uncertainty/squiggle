"use client";
import { FC, ReactNode, useState } from "react";

import {
  Bars4Icon,
  ScatterPlotIcon,
  StyledTab,
  TableCellsIcon,
} from "@quri/ui";

import { RelativeValuesDefinition } from "../types.js";
import { ModelEvaluator } from "../values/ModelEvaluator.js";
import { GridView } from "./views/GridView/index.js";
import { ListView } from "./views/ListView/index.js";
import { PlotView } from "./views/PlotView/index.js";
import {
  RelativeValuesOptions,
  RelativeValuesProvider,
} from "./views/RelativeValuesProvider.js";

export type RelativeValuesTab = "list" | "grid" | "plot";

export const relativeValuesTabs: {
  id: RelativeValuesTab;
  name: string;
  icon: typeof Bars4Icon;
}[] = [
  { id: "list", name: "List", icon: Bars4Icon },
  { id: "grid", name: "Grid", icon: TableCellsIcon },
  { id: "plot", name: "Plot", icon: ScatterPlotIcon },
];

export const RelativeValuesTabView: FC<{ tab: RelativeValuesTab }> = ({
  tab,
}) => {
  switch (tab) {
    case "list":
      return <ListView />;
    case "grid":
      return <GridView />;
    case "plot":
      return <PlotView />;
  }
};

export const RelativeValuesTabButtons: FC<{
  tab: RelativeValuesTab;
  onChange: (tab: RelativeValuesTab) => void;
}> = ({ tab, onChange }) => (
  <StyledTab.ListDiv>
    {relativeValuesTabs.map(({ id, name, icon }) => (
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

export type RelativeValuesDashboardProps = {
  definition: RelativeValuesDefinition;
  evaluator: ModelEvaluator;
  // Controlled mode; if set, `initialTab` is ignored.
  tab?: RelativeValuesTab;
  // Uncontrolled mode; defaults to "list".
  initialTab?: RelativeValuesTab;
  onTabChange?: (tab: RelativeValuesTab) => void;
  // Defaults to true. Hide if you render tab buttons yourself.
  showTabs?: boolean;
  // Rendered on the left side of the header row. Defaults to the definition title.
  header?: ReactNode;
} & RelativeValuesOptions;

export const RelativeValuesDashboard: FC<RelativeValuesDashboardProps> = ({
  definition,
  evaluator,
  tab: controlledTab,
  initialTab = "list",
  onTabChange,
  showTabs = true,
  header,
  ...options
}) => {
  const [uncontrolledTab, setUncontrolledTab] =
    useState<RelativeValuesTab>(initialTab);
  const tab = controlledTab ?? uncontrolledTab;

  const changeTab = (newTab: RelativeValuesTab) => {
    setUncontrolledTab(newTab);
    onTabChange?.(newTab);
  };

  const headerContent =
    header === undefined ? (
      <div className="font-semibold text-gray-700">{definition.title}</div>
    ) : (
      header
    );

  return (
    <RelativeValuesProvider
      definition={definition}
      evaluator={evaluator}
      {...options}
    >
      <div className="flex flex-col gap-4">
        {(showTabs || headerContent) && (
          <div className="flex items-center justify-between gap-4">
            <div>{headerContent}</div>
            {showTabs && (
              <RelativeValuesTabButtons tab={tab} onChange={changeTab} />
            )}
          </div>
        )}
        <RelativeValuesTabView tab={tab} />
      </div>
    </RelativeValuesProvider>
  );
};
