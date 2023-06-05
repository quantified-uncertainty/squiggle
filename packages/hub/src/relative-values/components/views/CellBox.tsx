import clsx from "clsx";
import { FC, PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  header?: boolean;
  clickable?: boolean;
}>;

export const CellBox: FC<Props> = ({ children, header, clickable }) => (
  <div
    className={clsx(
      "border-t border-l border-gray-200 h-full",
      header && "bg-gray-50 sticky top-0 left-0 z-10",
      clickable && "cursor-pointer hover:bg-gray-200"
    )}
  >
    {children}
  </div>
);
