import { FC, useState } from "react";

import { IconProps } from "../../icons/Icon.js";
import { ActionItemInternal } from "./DropdownMenuActionItemInternal.js";

type AsyncActionItemProps = {
  icon: FC<IconProps>;
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
      <ActionItemInternal icon={icon} title={title} acting={acting} />
    </div>
  );
};
