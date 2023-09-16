import { IconProps, StyledTab } from "@quri/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { FC, ReactNode } from "react";

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
    <Link href={href}>
      <StyledTab.Button isSelected={isSelected} name={name} icon={Icon} />
    </Link>
  );
};

StyledTabLink.List = StyledTab.ListDiv;
