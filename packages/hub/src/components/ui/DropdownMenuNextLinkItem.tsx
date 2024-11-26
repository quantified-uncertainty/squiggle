import { FC } from "react";

import { DropdownMenuItemLayout, IconProps } from "@quri/ui";

import { Link } from "./Link";

type Props = {
  href: string;
  title: string;
  icon?: FC<IconProps>;
  close: () => void;
  prefetch?: boolean;
};

export const DropdownMenuNextLinkItem: FC<Props> = ({
  title,
  href,
  icon,
  close,
  prefetch,
}) => {
  return (
    <Link href={href} onClick={close} prefetch={prefetch}>
      <DropdownMenuItemLayout icon={icon} title={title} />
    </Link>
  );
};
