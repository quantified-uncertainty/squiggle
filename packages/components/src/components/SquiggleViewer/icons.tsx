import { clsx } from "clsx";
import { FC } from "react";

import { IconProps, TriangleIcon } from "@quri/ui";

export const CollapsedIcon: FC<IconProps> = ({ className, ...props }) => (
  <TriangleIcon className={clsx("rotate-90", className)} {...props} />
);

export const ExpandedIcon: FC<IconProps> = ({ className, ...props }) => (
  <TriangleIcon className={clsx("rotate-180", className)} {...props} />
);
