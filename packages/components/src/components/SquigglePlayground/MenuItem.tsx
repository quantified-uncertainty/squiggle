import * as React from "react";
import { clsx } from "clsx";
import { TextTooltip } from "@quri/ui";

export const MenuItem: React.FC<{
  icon?: (props: { className?: string }) => React.ReactElement | null;
  children?: React.ReactNode;
  iconClasses?: string;
  iconColorClasses?: string;
  iconSpin?: boolean;
  onClick?: () => void;
  tooltipText?: string;
  className?: string;
}> = ({
  icon: Icon,
  iconColorClasses,
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
      className={
        "flex items-center text-slate-600 space-x-1 text-sm px-4 h-full cursor-pointer hover:bg-slate-200 select-none whitespace-nowrap transition " +
        className
      }
      onClick={onClick}
    >
      {Icon && (
        <Icon
          className={clsx(
            iconSize,
            "flex-shrink-0",
            iconColorClasses || "text-slate-400",
            iconSpin && "animate-spin"
          )}
        />
      )}
      {children && <div className="flex">{children}</div>}
    </div>
  );

  return tooltipText ? withTooltip(main) : main;
};
