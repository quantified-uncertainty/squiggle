import clsx from "clsx";
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
    <button
      className={clsx(
        "rounded-md py-0.5 bg-slate-500 text-white text-xs font-semibold flex items-center space-x-1",
        status ? "bg-slate-500" : "bg-gray-400",
        status ? "pl-1 pr-3" : "pl-3 pr-1",
        !status && "flex-row-reverse space-x-reverse"
      )}
      onClick={() => onChange(!status)}
    >
      <div>
        <CurrentIcon className={clsx("w-6 h-6", spinIcon && "animate-spin")} />
      </div>
      <span>{status ? onText : offText}</span>
    </button>
  );
};
