import { FC } from "react";
import {
  DropdownMenuItemLayout,
  ItemLayoutProps,
} from "./DropdownMenuItemLayout.js";

type ActionItemProps = ItemLayoutProps & {
  onClick(): void;
};

export const DropdownMenuActionItem: FC<ActionItemProps> = ({
  title,
  icon,
  onClick,
}) => {
  return (
    <div onClick={onClick}>
      <DropdownMenuItemLayout icon={icon} title={title} />
    </div>
  );
};
