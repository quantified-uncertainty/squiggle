import { FC } from "react";

import { IconProps } from "../index.js";

export const IconDisplay: FC<{ icon: FC<IconProps>; name: string }> = ({
  icon: Icon,
  name,
}) => {
  return (
    <div className="flex flex-col items-center justify-start rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex h-10 w-10 items-center justify-center text-slate-700">
        <Icon className="h-6 w-6" />
      </div>
      <span className="mt-2 text-center !text-sm font-medium text-gray-700">
        {name}
      </span>
    </div>
  );
};
