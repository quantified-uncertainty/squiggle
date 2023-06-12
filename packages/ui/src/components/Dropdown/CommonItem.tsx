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
    <div className="rounded px-2 py-1.5 flex items-center gap-2 group hover:bg-slate-100 transition-colors duration-75 cursor-pointer">
      <Icon
        size={16}
        className={clsx("text-slate-900", acting && "animate-spin")}
      />
      <div className="text-slate-900 text-sm">{title}</div>
    </div>
  );
};
