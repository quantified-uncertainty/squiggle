import { DropdownMenuActionItem } from "@quri/ui";
import { ExternalLinkIcon } from "@quri/ui";
import { useRouter } from "next/navigation";
import { FC } from "react";

type Props = {
  href: string;
  title: string;
  //   icon?: typeof ExternalLinkIcon;
};

export const DropdownMenuLinkItem: FC<Props> = ({ title, href }) => {
  const router = useRouter();

  const onClick = () => {
    router.push(href);
  };

  return (
    <DropdownMenuActionItem
      onClick={onClick}
      title={title}
      icon={ExternalLinkIcon}
    />
  );
};
