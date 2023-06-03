import { clsx } from "clsx";
import { FC } from "react";

import { RefreshIcon } from "../../icons/RefreshIcon.js";
import { IconProps } from "../../icons/Icon.js";

export type CommonProps = {
  icon: FC<IconProps>;
  title: string;
  acting?: boolean;
};

export const CommonItem: FC<CommonProps> = ({ title, icon, acting }) => {
  const Icon = acting ? RefreshIcon : icon;
  return (
    <div className="px-4 py-2 flex items-center gap-2 group hover:bg-slate-100 cursor-pointer">
      <Icon
        size={14}
        className={clsx(
          "text-slate-400 group-hover:text-slate-900",
          acting && "animate-spin"
        )}
      />
      <div className="text-slate-600 group-hover:text-slate-900 text-sm font-medium">
        {title}
      </div>
    </div>
  );
};
