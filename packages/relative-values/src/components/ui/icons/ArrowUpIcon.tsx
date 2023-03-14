import { FC } from "react";
import { Icon, IconProps } from "./Icon";

export const ArrowUpIcon: FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      d="M4.16669 8.33333L10 2.5M10 2.5L15.8334 8.33333M10 2.5V17.5"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);
