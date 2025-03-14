import clsx from "clsx";
import { FC, PropsWithChildren } from "react";

export const Card: FC<
  PropsWithChildren<{
    // theme="big" is used in spectests for prototyping key-value field grids.
    // Default theme is used for smaller cards on the frontpage; these cards have hover effects.
    theme?: "big";
  }>
> = ({ children, theme }) => {
  return (
    <div
      className={clsx(
        "rounded border border-gray-200",
        theme === "big" ? "p-6" : "px-5 py-3 hover:bg-gray-50"
      )}
    >
      {children}
    </div>
  );
};
