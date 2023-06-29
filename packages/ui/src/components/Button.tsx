import { FC, PropsWithChildren } from "react";
import { clsx } from "clsx";

type ButtonTheme = "default" | "primary";

type Props = PropsWithChildren<{
  onClick?: () => void;
  wide?: boolean; // stretch the button horizontally
  theme?: ButtonTheme;
  disabled?: boolean;
  height?: string;
  size?: "small" | "medium";
  // We default to type="button", to avoid form-related bugs.
  // In HTML standard, there's also "reset", but it's rarely useful.
  type?: "submit" | "button";
}>;

export const Button: FC<Props> = ({
  onClick,
  wide,
  theme = "default",
  disabled,
  type = "button",
  size = "medium",
  children,
}) => {
  return (
    <button
      className={clsx(
        "border text-sm font-medium flex items-center justify-center space-x-1",
        theme === "primary"
          ? "bg-green-700 border-green-900 text-white"
          : "bg-slate-100 border-slate-300 text-gray-600",
        disabled
          ? "opacity-60"
          : theme === "primary"
          ? "hover:bg-green-800 hover:border-green-800 hover:text-white"
          : "hover:bg-slate-200 hover:text-gray-900",
        wide && "w-full",
        size === "medium" && "px-4 h-8 rounded-md",
        size === "small" && "px-3 h-6 rounded-sm"
      )}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
};
