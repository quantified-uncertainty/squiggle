"use client";
import { FC } from "react";

import type { Axis, RelativeValuesSortMode } from "../../state/types.js";
import { usePresentation } from "../host/presentation.js";
import { DropdownButton } from "../ui/DropdownButton.js";
import {
  AxisMenu,
  type AxisMenuSection,
  useAxisMenuSections,
} from "../views/GridView/AxisMenu.js";

/**
 * A dropdown with the "Clusters" and "Sort by" sections of an axis (like
 * Table Settings), for host layouts. Hidden if all its sections are hidden
 * or locked.
 */
export const RelativeValuesSortMenu: FC<{
  className?: string;
  axis?: Axis;
  sections?: readonly AxisMenuSection[];
  sortOptions?: readonly RelativeValuesSortMode[];
  // Button text; defaults to "Sort by", "Clusters" or the settings label.
  label?: string;
}> = ({ className, axis = "rows", sections, sortOptions, label }) => {
  const { labels } = usePresentation();
  const visible = useAxisMenuSections(axis, sections, sortOptions);
  if (visible.length === 0) {
    return null;
  }
  const text =
    label ??
    (visible.length === 2
      ? axis === "rows"
        ? labels["list.tableSettings"]
        : labels["grid.columnSettings"]
      : visible[0] === "sort"
        ? labels["menu.sortBy"]
        : labels["menu.clusters"]);
  return (
    <div className={className} data-rv-part="sort-menu">
      <DropdownButton text={text}>
        {() => (
          <AxisMenu
            axis={axis}
            sections={visible}
            sortOptions={sortOptions}
            sortByAverage={false}
          />
        )}
      </DropdownButton>
    </div>
  );
};
