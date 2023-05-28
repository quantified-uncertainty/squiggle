import { clsx } from "clsx";
import { FC, PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  size?: "normal" | "large";
}>;

export const Header: FC<Props> = ({ children, size = "normal" }) => {
  return (
    <header
      className={clsx(
        size === "normal" && "text-xl font-bold mb-2",
        size === "large" && "text-2xl font-bold mb-2"
      )}
    >
      {children}
    </header>
  );
};
