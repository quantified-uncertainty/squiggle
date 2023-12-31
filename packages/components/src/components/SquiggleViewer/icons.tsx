import { clsx } from "clsx";
import { FC } from "react";

import { ChevronRightIcon, IconProps } from "@quri/ui";

export const CollapsedIcon: FC<IconProps> = ({ className, ...props }) => (
  <ChevronRightIcon className={clsx(className)} {...props} />
);

export const ExpandedIcon: FC<IconProps> = ({ className, ...props }) => (
  <ChevronRightIcon className={clsx("rotate-90", className)} {...props} />
);
