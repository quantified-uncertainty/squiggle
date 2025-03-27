import { FC } from "react";

import { DropdownMenuItemLayout, IconProps, useCloseDropdown } from "@quri/ui";

import { Link } from "./Link";

type Props = {
  href: string;
  title: string;
  icon?: FC<IconProps>;
  close?: () => void;
  prefetch?: boolean;
};

export const DropdownMenuNextLinkItem: FC<Props> = ({
  title,
  href,
  icon,
  close,
  prefetch,
}) => {
  const closeDropdown = useCloseDropdown();
  return (
    <Link href={href} onClick={close ?? closeDropdown} prefetch={prefetch}>
      <DropdownMenuItemLayout icon={icon} title={title} />
    </Link>
  );
};
