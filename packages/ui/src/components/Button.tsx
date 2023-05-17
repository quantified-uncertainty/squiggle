import { FC, PropsWithChildren } from "react";
import { clsx } from "clsx";

type ButtonTheme = "default";

type Props = PropsWithChildren<{
  onClick?: () => void;
  wide?: boolean; // stretch the button horizontally
  theme?: ButtonTheme;
  disabled?: boolean;
  // We default to type="button", to avoid form-related bugs.
  // In HTML standard, there's also "reset", but it's rarely useful.
  type?: "submit" | "button";
}>;

export const Button: FC<Props> = ({
  onClick,
  wide,
  // theme = "light",
  disabled,
  type = "button",
  children,
}) => {
  return (
    <button
      className={clsx(
        "rounded-md h-8 px-4 border text-sm font-medium flex items-center justify-center space-x-1",
        "bg-slate-100 border-slate-300 text-gray-600",
        disabled ? "opacity-60" : "hover:bg-slate-200 hover:text-gray-900",
        wide && "w-full"
      )}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
};
