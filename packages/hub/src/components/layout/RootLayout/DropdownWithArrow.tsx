import { FC } from "react";

import { TriangleIcon } from "@quri/ui";

export const DropdownWithArrow: FC<{ text: string }> = ({ text }) => (
  <div className="flex cursor-pointer select-none items-center rounded-md px-2 py-1 text-sm text-white hover:bg-slate-700">
    {text}
    <TriangleIcon size={8} className="ml-1.5 rotate-180 text-slate-300" />
  </div>
);
