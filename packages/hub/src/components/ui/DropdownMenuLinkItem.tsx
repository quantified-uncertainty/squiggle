import { DropdownMenuActionItem } from "@quri/ui";
import { ExternalLinkIcon, IconProps } from "@quri/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FC } from "react";

type Props = {
  href: string;
  title: string;
  icon?: FC<IconProps>;
  close: () => void;
};

export const DropdownMenuLinkItem: FC<Props> = ({
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
