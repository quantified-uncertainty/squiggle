import { clsx } from "clsx";
import { FC, PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  size?: "normal" | "large";
}>;

export const H1: FC<Props> = ({ children, size = "normal" }) => {
  return (
    <h1
      className={clsx(
        size === "normal" && "text-xl font-bold mb-2",
        size === "large" && "text-2xl font-bold mb-4"
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
        size === "normal" && "text-lg text-gray-600 font-semibold mb-2",
        size === "large" && "text-xl font-bold mb-4"
      )}
    >
      {children}
    </h2>
  );
};
