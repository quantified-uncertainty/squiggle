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
          "flex cursor-pointer select-none items-center gap-1 whitespace-nowrap rounded-sm px-2 py-2 text-sm text-slate-800 hover:bg-slate-200"
        )}
      >
        <div className="relative" key={String(spinIcon)}>
          <CurrentIcon
            className={clsx(
              "relative h-6 w-6 opacity-100",
              spinIcon && "animate-hide"
            )}
          />
          {spinIcon && (
            <RefreshIcon className="animate-appear-and-spin absolute top-0 h-6 w-6 opacity-0" />
          )}
        </div>
        <span>{status ? onText : offText}</span>
      </div>
    </div>
  );
};
