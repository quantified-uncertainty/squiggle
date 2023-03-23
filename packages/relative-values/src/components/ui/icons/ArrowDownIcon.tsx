import { FC } from "react";
import { Icon, IconProps } from "./Icon";

export const ArrowDownIcon: FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      d="M15.8334 11.6667L10 17.5M10 17.5L4.16669 11.6667M10 17.5V2.5"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);
