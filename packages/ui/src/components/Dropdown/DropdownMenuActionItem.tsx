import { FC } from "react";
import {
  ActionItemInternal,
  ActionItemInternalProps,
} from "./DropdownMenuActionItemInternal.js";

type ActionItemProps = ActionItemInternalProps & {
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
