import { clsx } from "clsx";
import { FC } from "react";

import { RefreshIcon } from "../../icons/RefreshIcon.js";
import { IconProps } from "../../icons/Icon.js";

export type CommonProps = {
  icon?: FC<IconProps>;
  title: string;
  acting?: boolean;
};

const iconDisplay = (icon?: FC<IconProps>, acting?: boolean) => {
  if (!icon) return null;
  const Icon = acting ? RefreshIcon : icon;
  return (
    <Icon
      size={14}
      className={clsx(
        "text-slate-400 group-hover:text-slate-900",
        acting && "animate-spin"
      )}
    />
  );
};

export const ActionItemInternal: FC<CommonProps> = ({
  title,
  icon,
  acting,
}) => {
  return (
    <div className="rounded px-2 py-1.5 flex items-center gap-2 group hover:bg-slate-100 transition-colors duration-75 cursor-pointer">
      {iconDisplay(icon, acting)}
      <div className="text-slate-700 group-hover:text-slate-900 text-sm font-medium">
        {title}
      </div>
    </div>
  );
};
