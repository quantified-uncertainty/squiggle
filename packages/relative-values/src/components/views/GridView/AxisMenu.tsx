"use client";
import clsx from "clsx";
import { FC } from "react";

import type {
  Axis,
  RelativeValuesSort,
  RelativeValuesSortMode,
  RelativeValuesState,
} from "../../../state/types.js";
import { useCore } from "../../host/core.js";
import { usePresentation } from "../../host/presentation.js";
import type { RelativeValuesLabels } from "../../host/types.js";
import { FormHeader } from "../../ui/FormHeader.js";
import { ArrowDownIcon } from "../../ui/icons/ArrowDownIcon.js";
import { ArrowLeftIcon } from "../../ui/icons/ArrowLeftIcon.js";
import { ArrowRightIcon } from "../../ui/icons/ArrowRightIcon.js";
import { ArrowUpIcon } from "../../ui/icons/ArrowUpIcon.js";
import { ClusterFilter } from "../ClusterFilter.js";

export type AxisMenuSection = "clusters" | "sort";

const defaultSortOptions: readonly RelativeValuesSortMode[] = [
  "default",
  "median",
  "uncertainty",
  "similarity",
  "name",
  "cluster",
];

export function axisSort(
  state: RelativeValuesState<string>,
  axis: Axis
): RelativeValuesSort {
  return axis === "rows" || state.columns === "rows"
    ? state.sort
    : state.columns.sort;
}

/**
 * The sort modes offered in "Sort by": `sortOptions`, else
 * `controls.sortMenu.sortOptions`, else the built-in modes and the
 * host-registered sorts.
 */
export function useSortOptions(
  sortOptions?: readonly RelativeValuesSortMode[]
): readonly RelativeValuesSortMode[] {
  const core = useCore();
  const { controls } = usePresentation();
  return (
    sortOptions ??
    controls.sortMenu.sortOptions ?? [
      ...defaultSortOptions,
      ...Object.keys(core.sorts ?? {}),
    ]
  );
}

/**
 * The sections of an axis menu that are shown (not hidden or locked; "Sort
 * by" is hidden when no sort mode is offered).
 */
export function useAxisMenuSections(
  axis: Axis,
  sections: readonly AxisMenuSection[] = ["clusters", "sort"],
  sortOptions?: readonly RelativeValuesSortMode[]
): AxisMenuSection[] {
  const core = useCore();
  const { controls } = usePresentation();
  const options = useSortOptions(sortOptions);
  const clustersKey = axis === "rows" ? "clusters" : "columns";
  const sortKey = axis === "rows" ? "sort" : "columns";
  return sections.filter((section) =>
    section === "clusters"
      ? controls.sortMenu.clusters && !core.isLocked(clustersKey)
      : controls.sortMenu.sort && !core.isLocked(sortKey) && options.length > 0
  );
}

function sortLabel(
  mode: RelativeValuesSortMode,
  labels: RelativeValuesLabels,
  sortByAverage: boolean,
  customLabel: string | undefined
): string {
  switch (mode) {
    case "default":
      return labels["sort.default"];
    case "median":
      return sortByAverage
        ? labels["sort.medianAverage"]
        : labels["sort.median"];
    case "uncertainty":
      return sortByAverage
        ? labels["sort.uncertaintyAverage"]
        : labels["sort.uncertainty"];
    case "similarity":
      return labels["sort.similarity"];
    case "name":
      return labels["sort.name"];
    case "cluster":
      return labels["sort.cluster"];
    default:
      return customLabel ?? mode;
  }
}

const SortBy: FC<{
  axis: Axis;
  mode: RelativeValuesSortMode; // mode of this control
  sort: RelativeValuesSort; // current sort of this axis
  text: string;
}> = ({ axis, mode, sort, text }) => {
  const core = useCore();

  const isCurrentMode = mode === sort.mode;
  const targetDesc = isCurrentMode ? !sort.desc : false;
  const iconDesc = isCurrentMode ? sort.desc : false;

  const Icon =
    axis === "rows"
      ? iconDesc
        ? ArrowUpIcon
        : ArrowDownIcon
      : iconDesc
        ? ArrowLeftIcon
        : ArrowRightIcon;

  return (
    <div
      className="group flex cursor-pointer items-center"
      data-rv-sort={mode}
      onClick={() =>
        core.dispatch(
          { type: "setSort", sort: { mode, desc: targetDesc }, axis },
          "user"
        )
      }
    >
      <Icon
        className={
          isCurrentMode
            ? "stroke-gray-600"
            : "stroke-white group-hover:stroke-gray-300"
        }
      />
      <div
        className={clsx(
          "ml-2 text-sm font-medium",
          isCurrentMode ? "text-black" : "text-gray-400 group-hover:text-black"
        )}
      >
        {text}
      </div>
    </div>
  );
};

/** "Clusters" and "Sort by" for an axis (Table, Row and Column Settings). */
export const AxisMenu: FC<{
  axis: Axis;
  // "Average value" instead of "Value" (the grid).
  sortByAverage?: boolean;
  sections?: readonly AxisMenuSection[];
  sortOptions?: readonly RelativeValuesSortMode[];
}> = ({ axis, sortByAverage = true, sections, sortOptions }) => {
  const core = useCore();
  const { labels } = usePresentation();
  const visible = useAxisMenuSections(axis, sections, sortOptions);
  const sort = axisSort(core.state, axis);
  const sorts = core.sorts ?? {};
  const options = useSortOptions(sortOptions);

  return (
    <div className="flex min-w-[16em] flex-col gap-6 px-6 py-6">
      {visible.includes("clusters") && (
        <div>
          <FormHeader>{labels["menu.clusters"]}</FormHeader>
          <ClusterFilter axis={axis} />
        </div>
      )}
      {visible.includes("sort") && (
        <div>
          <FormHeader>{labels["menu.sortBy"]}</FormHeader>
          <div className="flex flex-col gap-2">
            {options.map((mode) => (
              <SortBy
                key={mode}
                axis={axis}
                sort={sort}
                mode={mode}
                text={sortLabel(
                  mode,
                  labels,
                  sortByAverage,
                  sorts[mode]?.label
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
