import { clsx } from "clsx";
import { ComponentType, FC, ReactNode } from "react";

import { TextTooltip } from "@quri/ui";

type Props = {
  icon?: ComponentType<{ className?: string }>;
  children?: ReactNode;
  iconClasses?: string;
  iconSpin?: boolean;
  onClick?: () => void;
  tooltipText?: string;
  className?: string;
};

export const ToolbarItem: FC<Props> = ({
  icon: Icon,
  iconClasses,
  iconSpin,
  className,
  onClick,
  tooltipText,
  children,
}) => {
  const withTooltip = (jsx: JSX.Element) => (
    <TextTooltip text={tooltipText || ""} placement="bottom" offset={5}>
      {jsx}
    </TextTooltip>
  );
  const iconSize = children ? "h-3 w-3" : "h-5 w-5";
  const main = (
    <div
      className={clsx(
        "flex items-center text-slate-600 space-x-1 text-sm px-4 h-full cursor-pointer hover:bg-slate-200 select-none whitespace-nowrap transition ",
        className
      )}
      onClick={onClick}
    >
      {Icon && (
        <Icon
          className={clsx(
            iconSize,
            "flex-shrink-0 text-slate-400",
            iconClasses,
            iconSpin && "animate-spin"
          )}
        />
      )}
      {children && <div className="flex">{children}</div>}
    </div>
  );

  return tooltipText ? withTooltip(main) : main;
};
