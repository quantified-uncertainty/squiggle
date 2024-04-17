import { clsx } from "clsx";
import { FC, ReactNode } from "react";

import { IconProps } from "../../icons/Icon.js";
import { RefreshIcon } from "../../icons/RefreshIcon.js";

export type ItemLayoutProps = {
  icon?: FC<IconProps>;
  title: string | ReactNode; // if title is JSX, you should consider text color in normal and hovered state
  acting?: boolean;
};

const iconDisplay = (icon?: FC<IconProps>, acting?: boolean) => {
  if (!icon) return null;
  const Icon = acting ? RefreshIcon : icon;
  return (
    <Icon
      size={14}
      className={clsx(
        "text-gray-400 group-hover:text-gray-500",
        acting && "animate-spin"
      )}
    />
  );
};

export const DropdownMenuItemLayout: FC<ItemLayoutProps> = ({
  title,
  icon,
  acting,
}) => {
  return (
    <div className="group m-1 flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-colors duration-75 hover:bg-slate-50">
      {iconDisplay(icon, acting)}
      <div className="flex-1 text-sm font-light text-gray-700 group-hover:text-gray-900">
        {title}
      </div>
    </div>
  );
};
