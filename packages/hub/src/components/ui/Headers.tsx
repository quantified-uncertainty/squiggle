import { clsx } from "clsx";
import { FC, PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  size?: "normal" | "large";
}>;

export const H1: FC<Props> = ({ children, size = "normal" }) => {
  return (
    <h1
      className={clsx(
        size === "normal" && "mb-2 text-xl font-bold",
        size === "large" && "mb-4 text-2xl font-bold"
      )}
    >
      {children}
    </h1>
  );
};

export const H2: FC<Props> = ({ children, size = "normal" }) => {
  return (
    <h2
      className={clsx(
        size === "normal" && "mb-2 text-lg font-semibold text-gray-600",
        size === "large" && "mb-4 text-xl font-bold"
      )}
    >
      {children}
    </h2>
  );
};
