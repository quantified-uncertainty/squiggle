"use client";
import { FC, useState } from "react";

import { IconProps } from "../../icons/Icon.js";
import { DropdownMenuItemLayout } from "./DropdownMenuItemLayout.js";

type AsyncActionItemProps = {
  icon?: FC<IconProps>;
  title: string;
  onClick(): Promise<void>;
  close(): void;
};

export const DropdownMenuAsyncActionItem: FC<AsyncActionItemProps> = ({
  title,
  icon,
  onClick,
  close,
}) => {
  const [acting, setActing] = useState(false);
  const act = async () => {
    if (acting) {
      return;
    }
    setActing(true);
    await onClick();
    setActing(false);
    close();
  };

  return (
    <div onClick={act}>
      <DropdownMenuItemLayout icon={icon} title={title} acting={acting} />
    </div>
  );
};
