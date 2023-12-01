import { FC, PropsWithChildren } from "react";
import { clsx } from "clsx";

export const SearchResultBox: FC<
  PropsWithChildren<{ hoverable?: boolean }>
> = ({ children, hoverable = true }) => (
  // matches the styles from DropdownMenuItemLayout
  <div
    className={clsx(
      "m-1 rounded px-2 py-1.5 text-sm",
      hoverable &&
        "hover:bg-blue-100 transition-colors duration-75 cursor-pointer"
    )}
  >
    {children}
  </div>
);
