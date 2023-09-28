import { FC } from "react";
import { IconProps } from "../../icons/Icon.js";
import { DropdownMenuItemLayout } from "./DropdownMenuItemLayout.js";
import { ExternalLinkIcon } from "../../index.js";

type Props = {
  href: string;
  title: string;
  icon?: FC<IconProps>;
  close: () => void;
  newTab?: boolean;
};

// In Next.js apps you should prefer `DropdownMenuNextLinkItem` instead of using this component.
// (See hub's source code for implementation.)
export const DropdownMenuLinkItem: FC<Props> = ({
  href,
  title,
  icon,
  close,
  newTab,
}) => {
  return (
    <a
      href={href}
      onClick={close}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noreferrer" : undefined}
    >
      <DropdownMenuItemLayout icon={icon ?? ExternalLinkIcon} title={title} />
    </a>
  );
};
