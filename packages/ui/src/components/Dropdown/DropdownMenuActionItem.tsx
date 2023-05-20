import { FC } from "react";
import { CommonItem, CommonProps } from "./CommonItem.js";

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
      <CommonItem icon={icon} title={title} />
    </div>
  );
};
