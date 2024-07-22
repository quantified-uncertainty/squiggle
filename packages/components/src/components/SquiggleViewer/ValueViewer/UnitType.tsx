import clsx from "clsx";
import { FC } from "react";

type UnitTypeProps = {
    unitType: string;
};

export const UnitType: FC<UnitTypeProps> = ({ unitType }) => {
    return (
        <div
        className={clsx(
            // Copilot auto-completed these classes but it looks pretty good
            "text-xs font-medium text-gray-500",
            "rounded-full px-2 py-0.5",
            /* "bg-gray-100" */  // IMO looks better without background
        )}
        >
        :: {unitType}
        </div>
    );
}
