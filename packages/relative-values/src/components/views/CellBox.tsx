import clsx from "clsx";
import { FC, PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  header?: boolean;
  clickable?: boolean;
  className?: string;
}>;

export const CellBox: FC<Props> = ({
  children,
  header,
  clickable,
  className,
}) => (
  <div
    className={clsx(
      "h-full border-l border-t border-[color:var(--squiggle-rv-border,#e5e7eb)]",
      header &&
        "sticky left-0 top-0 z-10 bg-[var(--squiggle-rv-header-bg,#f9fafb)]",
      clickable && "cursor-pointer hover:bg-gray-200",
      className
    )}
  >
    {children}
  </div>
);
