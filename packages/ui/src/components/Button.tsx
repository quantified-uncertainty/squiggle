import { FC, PropsWithChildren } from "react";
import { clsx } from "clsx";

type Props = PropsWithChildren<{
  onClick: () => void;
  wide?: boolean; // stretch the button horizontally
}>;

export const Button: FC<Props> = ({ onClick, wide, children }) => {
  return (
    <button
      className={clsx(
        "rounded-md py-1.5 px-2 bg-slate-500 text-white text-xs font-semibold flex items-center justify-center space-x-1",
        wide && "w-full"
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
