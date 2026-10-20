"use client";
import clsx from "clsx";
import { FC } from "react";

import type { GridMode } from "../../../state/types.js";
import { useCore } from "../../host/core.js";
import { usePresentation } from "../../host/presentation.js";
import { FullGridIcon } from "../../ui/icons/FullGridIcon.js";
import { HalfGridIcon } from "../../ui/icons/HalfGridIcon.js";
import { IconProps } from "../../ui/icons/Icon.js";

const SelectableIcon: FC<{
  icon: FC<IconProps>;
  onClick(): void;
  selected: boolean;
  label: string;
}> = ({ icon: Icon, onClick, selected, label }) => {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      className="flex"
      onClick={onClick}
    >
      <Icon
        size={24}
        className={clsx(
          "cursor-pointer hover:fill-gray-900",
          selected ? "fill-gray-600" : "fill-gray-300"
        )}
      />
    </button>
  );
};

/** Full / half grid; hidden while `gridMode` is locked. */
export const GridModeControls: FC<{ className?: string }> = ({ className }) => {
  const core = useCore();
  const { labels } = usePresentation();
  if (core.isLocked("gridMode")) {
    return null;
  }
  const { gridMode } = core.state;
  const set = (mode: GridMode) =>
    core.dispatch({ type: "setGridMode", mode }, "user");

  return (
    <div className={clsx("flex gap-1", className)} data-rv-part="grid-mode">
      <SelectableIcon
        icon={FullGridIcon}
        label={labels["grid.full"]}
        onClick={() => set("full")}
        selected={gridMode === "full"}
      />
      <SelectableIcon
        icon={HalfGridIcon}
        label={labels["grid.half"]}
        onClick={() => set("half")}
        selected={gridMode === "half"}
      />
    </div>
  );
};
