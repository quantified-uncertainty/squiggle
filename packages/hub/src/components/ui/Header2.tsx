import { clsx } from "clsx";
import { FC, PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  size?: "normal" | "large";
}>;

export const Header2: FC<Props> = ({ children, size = "normal" }) => {
  return (
    <h2
      className={clsx(
        size === "normal" && "text-xl font-bold mb-2",
        size === "large" && "text-2xl font-bold mb-4"
      )}
    >
      {children}
    </h2>
  );
};
