import { clsx } from "clsx";
import { ComponentType, FC, ReactNode } from "react";

import { ChevronRightIcon, TextTooltip } from "@quri/ui";

type Props = {
  icon?: ComponentType<{ className?: string }>;
  children?: ReactNode;
  iconClasses?: string;
  iconSpin?: boolean;
  onClick?: () => void;
  tooltipText?: string;
  className?: string;
  showDropdownArrow?: boolean;
};

export const ToolbarItem: FC<Props> = ({
  icon: Icon,
  iconClasses,
  iconSpin,
  className,
  onClick,
  tooltipText,
  showDropdownArrow = false,
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
        "flex items-center font-light text-gray-500 space-x-1.5 text-sm px-4 h-full cursor-pointer hover:bg-gray-50 select-none whitespace-nowrap transition hover:text-gray-900",
        className
      )}
      onClick={onClick}
    >
      {Icon && (
        <Icon
          className={clsx(
            iconSize,
            "flex-shrink-0",
            iconClasses,
            iconSpin && "animate-spin"
          )}
        />
      )}
      {children && <div className="flex">{children}</div>}
      {showDropdownArrow && <ChevronRightIcon className="rotate-90" />}
    </div>
  );

  return tooltipText ? withTooltip(main) : main;
};
