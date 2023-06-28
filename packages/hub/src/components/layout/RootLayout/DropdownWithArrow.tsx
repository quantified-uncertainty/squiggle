import { FC } from "react";

import { TriangleIcon } from "@quri/ui";

export const DropdownWithArrow: FC<{ text: string }> = ({ text }) => (
  <div className="flex items-center text-white cursor-pointer hover:bg-slate-700 px-2 py-1 rounded-md select-none text-sm">
    {text}
    <TriangleIcon size={6} className="rotate-180 ml-2 text-slate-300" />
  </div>
);
