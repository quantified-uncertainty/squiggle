import { FC } from "react";
import { IconProps, StyledTab } from "@quri/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { PropsWithChildren, createContext, useContext } from "react";

type StyledTabLinkProps = {
  name: string;
  href: string;
  icon?: FC<IconProps>;
  selected?: (pathname: string, href: string) => boolean;
};

type StyledTabLinkType = React.FC<StyledTabLinkProps> & {
  List: React.FC<PropsWithChildren<{ selected?: string }>>;
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
    <Link href={href}>
      <StyledTab.Button isSelected={isSelected} name={name} icon={Icon} />
    </Link>
  );
};

StyledTabLink.List = function StyledTabLinkList({ children }) {
  return <StyledTab.ListDiv>{children}</StyledTab.ListDiv>;
};
