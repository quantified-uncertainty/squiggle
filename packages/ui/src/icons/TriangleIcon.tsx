import { FC } from "react";
import { Icon, IconProps } from "./Icon.js";

export const TriangleIcon: FC<IconProps> = (props) => (
  <Icon {...props}>
    <path d="M18 16.667h-16l8-13.333z" />
  </Icon>
);
