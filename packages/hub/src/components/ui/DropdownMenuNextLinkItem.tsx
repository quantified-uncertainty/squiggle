import { useRouter } from "next/navigation";
import { FC } from "react";

import { DropdownMenuActionItem, IconProps } from "@quri/ui";

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
  const router = useRouter();

  const onClick = () => {
    router.push(href);
    close();
  };

  return <DropdownMenuActionItem onClick={onClick} title={title} icon={icon} />;
};
