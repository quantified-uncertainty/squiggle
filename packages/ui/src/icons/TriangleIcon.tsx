import { FC } from "react";
import { Icon, IconProps } from "./Icon.js";

// From heroicons
export const TriangleIcon: FC<IconProps> = (props) => (
  <Icon {...props}>
    <path d="M20 18.333h-20l10-16.667z" />
  </Icon>
);
