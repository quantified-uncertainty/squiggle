import clsx from "clsx";
import { FC, PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  header?: boolean;
  clickable?: boolean;
}>;

export const CellBox: FC<Props> = ({ children, header, clickable }) => (
  <div
    className={clsx(
      "h-full border-l border-t border-gray-200",
      header && "sticky left-0 top-0 z-10 bg-gray-50",
      clickable && "cursor-pointer hover:bg-gray-200"
    )}
  >
    {children}
  </div>
);
