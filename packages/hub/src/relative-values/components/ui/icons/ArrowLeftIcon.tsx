import { FC } from "react";
import { Icon, IconProps } from "./Icon";

export const ArrowLeftIcon: FC<IconProps> = (props) => (
  <Icon {...props}>
    <path
      d="M8.33333 15.8333L2.5 9.99999M2.5 9.99999L8.33333 4.16666M2.5 9.99999H17.5"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);
