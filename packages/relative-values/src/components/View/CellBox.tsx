import clsx from "clsx";
import { FC, PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  header?: boolean;
}>;

export const CellBox: FC<Props> = ({ children, header }) => (
  <div
    className={clsx(
      "border-t border-l border-gray-200",
      header && "bg-gray-50 sticky top-0 left-0 z-10"
    )}
  >
    {children}
  </div>
);
