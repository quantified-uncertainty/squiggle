import { FC } from "react";
import Link from "next/link";
import { IconProps } from "@/relative-values/components/ui/icons/Icon";

export const PageMenuLink: FC<{
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
