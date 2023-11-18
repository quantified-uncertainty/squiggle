import { FC } from "react";
import {
  DropdownMenuItemLayout,
  ItemLayoutProps,
} from "./DropdownMenuItemLayout.js";

type ActionItemProps = ItemLayoutProps & {
  // If you want to close the dropdown on action, obtain the close function through `useCloseDropdown()` and call it in `onClick`.
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
