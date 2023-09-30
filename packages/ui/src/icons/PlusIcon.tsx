import { FC } from "react";
import { Icon, IconProps } from "./Icon.js";

// https://fontawesome.com/icons/plus?f=classic&s=solid
export const PlusIcon: FC<IconProps> = (props) => (
  <Icon {...props} viewBox="0 0 448 512">
    <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" />
  </Icon>
);
