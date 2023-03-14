import { FC } from "react";
import { Icon, IconProps } from "./Icon";

export const ArrowRightIcon: FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      d="M11.6667 4.16666L17.5 9.99999M17.5 9.99999L11.6667 15.8333M17.5 9.99999H2.5"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);
