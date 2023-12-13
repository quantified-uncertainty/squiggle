import Link from "next/link";
import { FC } from "react";

import { DropdownMenuItemLayout, IconProps } from "@quri/ui";

type Props = {
  href: string;
  title: string;
  icon?: FC<IconProps>;
  close: () => void;
};

export const DropdownMenuNextLinkItem: FC<Props> = ({
  title,
  href,
  icon,
  close,
}) => {
  return (
    <Link href={href} onClick={close}>
      <DropdownMenuItemLayout icon={icon} title={title} />
    </Link>
  );
};
