"use client";
import { usePathname } from "next/navigation";
import React, { FC, ReactNode } from "react";

import { IconProps, StyledTab } from "@quri/ui";

import { Link } from "./Link";

type StyledTabLinkProps = {
  name: string;
  href: string;
  icon?: FC<IconProps>;
  selected?: (pathname: string, href: string) => boolean;
  prefetch?: boolean;
};

type StyledTabLinkType = React.FC<StyledTabLinkProps> & {
  List: FC<{ children: ReactNode }>;
};

export const StyledTabLink: StyledTabLinkType = ({
  name,
  href,
  icon: Icon,
  selected,
  prefetch,
}) => {
  const pathname = usePathname();
  const isSelected = selected ? selected(pathname, href) : pathname === href;

  return (
    <Link href={href} prefetch={prefetch}>
      <StyledTab.Button isSelected={isSelected} name={name} icon={Icon} />
    </Link>
  );
};

const StyledTabLinkList = StyledTab.ListDiv;
StyledTabLink.List = StyledTabLinkList;

export { StyledTabLinkList };
