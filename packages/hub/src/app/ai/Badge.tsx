import clsx from "clsx";
import { FC, PropsWithChildren } from "react";

// TODO - move to @quri/ui?
export const Badge: FC<
  PropsWithChildren<{ theme: "blue" | "green" | "purple" }>
> = ({ theme, children }) => (
  <span
    className={clsx(
      "rounded-full px-2 py-1 text-xs",
      theme === "blue" && "bg-blue-100 text-blue-800",
      theme === "green" && "bg-green-100 text-green-800",
      theme === "purple" && "bg-purple-100 text-purple-800"
    )}
  >
    {children}
  </span>
);
