import clsx from "clsx";
import { FC } from "react";

import { FullGridIcon } from "../../ui/icons/FullGridIcon.js";
import { HalfGridIcon } from "../../ui/icons/HalfGridIcon.js";
import { IconProps } from "../../ui/icons/Icon.js";
import {
  useRelativeValuesContext,
  useRelativeValuesDispatch,
} from "../RelativeValuesProvider.js";

const SelectableIcon: FC<{
  icon: FC<IconProps>;
  onClick(): void;
  selected: boolean;
}> = ({ icon: Icon, onClick, selected }) => {
  return (
    <Icon
      size={24}
      className={clsx(
        "cursor-pointer hover:fill-gray-900",
        selected ? "fill-gray-600" : "fill-gray-300"
      )}
      onClick={onClick}
    />
  );
};

export const GridModeControls: FC = () => {
  const { gridMode } = useRelativeValuesContext();
  const dispatch = useRelativeValuesDispatch();

  return (
    <div className="flex gap-1">
      <SelectableIcon
        icon={FullGridIcon}
        onClick={() => dispatch({ type: "setGridMode", payload: "full" })}
        selected={gridMode === "full"}
      />
      <SelectableIcon
        icon={HalfGridIcon}
        onClick={() => dispatch({ type: "setGridMode", payload: "half" })}
        selected={gridMode === "half"}
      />
    </div>
  );
};
