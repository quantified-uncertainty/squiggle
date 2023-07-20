import { FC } from "react";
import {
  ActionItemInternal,
  CommonProps,
} from "./DropdownMenuActionItemInternal.js";

type ActionItemProps = CommonProps & {
  onClick(): void;
};

export const DropdownMenuActionItem: FC<ActionItemProps> = ({
  title,
  icon,
  onClick,
}) => {
  return (
    <div onClick={onClick}>
      <ActionItemInternal icon={icon} title={title} />
    </div>
  );
};
