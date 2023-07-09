import { FC, ReactNode } from "react";
import { IconProps, StyledTab } from "@quri/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import React, { PropsWithChildren, createContext, useContext } from "react";

type StyledTabLinkProps = {
  name: string;
  href: string;
  icon?: FC<IconProps>;
  selected?: (pathname: string, href: string) => boolean;
};

type StyledTabLinkType = React.FC<StyledTabLinkProps> & {
  List: FC<{ children: ReactNode }>;
};

export const StyledTabLink: StyledTabLinkType = ({
  name,
  href,
  icon: Icon,
  selected,
}) => {
  const pathname = usePathname();
  const isSelected = selected ? selected(pathname, href) : pathname === href;

  return (
    <Link
      href={href}
      className={clsx(
        "flex whitespace-nowrap py-2 text-md items-center border-b-2 group",
        isSelected
          ? "border-orange-500 text-slate-900 "
          : "text-gray-600 boredr-transparent"
      )}
    >
      <div className="items-center flex group-hover:bg-white rounded-md px-4 py-1">
        {Icon && <Icon className="mr-2" size={16} />}
        <span>{name}</span>
      </div>
    </Link>
  );
};

StyledTabLink.List = function List({ children }) {
  return <div className="-mb-px flex">{children}</div>;
};
