import { RefreshIcon } from "@heroicons/react/solid/esm/index.js";
import { clsx } from "clsx";
import React from "react";

type IconType = (props: React.ComponentProps<"svg">) => JSX.Element;

type Props = {
  status: boolean;
  onChange: (status: boolean) => void;
  texts: [string, string];
  icons: [IconType, IconType];
  spinIcon?: boolean;
};

export const Toggle: React.FC<Props> = ({
  status,
  onChange,
  texts: [onText, offText],
  icons: [OnIcon, OffIcon],
  spinIcon,
}) => {
  const CurrentIcon = status ? OnIcon : OffIcon;
  return (
    <div onClick={() => onChange(!status)}>
      <div
        className={clsx(
          "flex items-center gap-1 text-slate-800 text-sm px-2 py-2 cursor-pointer rounded-sm hover:bg-slate-200 select-none whitespace-nowrap"
        )}
      >
        <div className="relative" key={String(spinIcon)}>
          <CurrentIcon
            className={clsx(
              "w-6 h-6 opacity-100 relative",
              spinIcon && "animate-hide"
            )}
          />
          {spinIcon && (
            <RefreshIcon className="w-6 h-6 absolute top-0 opacity-0 animate-appear-and-spin" />
          )}
        </div>
        <span>{status ? onText : offText}</span>
      </div>
    </div>
  );
};
