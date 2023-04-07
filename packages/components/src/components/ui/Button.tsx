import React from "react";
import { clsx } from "clsx";

type Props = {
  onClick: () => void;
  children: React.ReactNode;
  wide?: boolean; // stretch the button horizontally
};

export const Button: React.FC<Props> = ({ onClick, wide, children }) => {
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
