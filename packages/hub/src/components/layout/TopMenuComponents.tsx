import { FC } from "react";
import { TriangleIcon } from "@quri/ui";

import Link from "next/link";
import { IconProps } from "@/relative-values/components/ui/icons/Icon";

export const DropdownWithArrow: FC<{ text: string }> = ({ text }) => (
  <div className="flex items-center text-white cursor-pointer hover:bg-slate-700 px-2 py-1 rounded-md select-none text-sm">
    {text}
    <TriangleIcon size={6} className={"rotate-180 ml-2 text-slate-300"} />
  </div>
);

export const StyledLink: FC<{
  title: string;
  href: string;
  icon: FC<IconProps>;
}> = ({ title, icon, href }) => {
  const Icon = icon;
  return (
    <Link
      className="text-white text-sm hover:bg-slate-700 px-2 py-1 rounded-md select-none"
      href={href}
    >
      <Icon className="inline-block mr-1 text-slate-400" size={14} />
      {title}
    </Link>
  );
};
