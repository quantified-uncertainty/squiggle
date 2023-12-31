import { FC } from "react";

import { IconProps } from "../../icons/Icon.js";
import { ExternalLinkIcon } from "../../index.js";
import { useCloseDropdown } from "./DropdownContext.js";
import { DropdownMenuItemLayout } from "./DropdownMenuItemLayout.js";

type Props = {
  href: string;
  title: string;
  icon?: FC<IconProps>;
  newTab?: boolean;
  // deprecated, this component will obtain the correct close automatically from dropdown context
  close?: () => void;
};

// In Next.js apps you should prefer `DropdownMenuNextLinkItem` instead of using this component.
// (See hub's source code for implementation.)
export const DropdownMenuLinkItem: FC<Props> = ({
  href,
  title,
  icon,
  newTab,
}) => {
  const closeDropdown = useCloseDropdown();

  return (
    <a
      href={href}
      onClick={closeDropdown}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noreferrer" : undefined}
    >
      <DropdownMenuItemLayout icon={icon ?? ExternalLinkIcon} title={title} />
    </a>
  );
};
