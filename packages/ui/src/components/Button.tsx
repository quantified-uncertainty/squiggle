import { FC, PropsWithChildren } from "react";
import { clsx } from "clsx";

type ButtonTheme = "default" | "primary";

export type ButtonProps = PropsWithChildren<{
  onClick?: () => void;
  wide?: boolean; // stretch the button horizontally
  theme?: ButtonTheme;
  disabled?: boolean;
  height?: string;
  size?: "small" | "medium";
  // We default to type="button", to avoid form-related bugs.
  // In HTML standard, there's also "reset", but it's rarely useful.
  type?: "submit" | "button";
  // More precise control for the button's layout. Disables padding and flexbox mode.
  noLayout?: boolean;
}>;

// For internal use only, for now (see ButtonWithDropdown).
export const ButtonGroup: FC<PropsWithChildren> = ({ children }) => {
  return <div className="flex items-center button-group">{children}</div>;
};

export const Button: FC<ButtonProps> = ({
  onClick,
  wide,
  theme = "default",
  disabled,
  size = "medium",
  type = "button",
  noLayout = false,
  children,
}) => {
  return (
    <button
      className={clsx(
        "border text-sm font-medium",
        theme === "primary"
          ? "bg-green-700 border-green-900 text-white"
          : "bg-slate-100 border-slate-300 text-gray-600",
        disabled
          ? "opacity-60"
          : theme === "primary"
          ? "hover:bg-green-800 hover:border-green-800 hover:text-white"
          : "hover:bg-slate-200 hover:text-gray-900",
        wide && "w-full",
        size === "medium" && "h-8 rounded-md",
        size === "small" && "h-6 rounded-sm",
        // This could probably be simplified, but I'm not sure how.
        // Tailwind group-* styles don't allow styling based on parent, only on parent state.
        "[.button-group_&:not(:first-child)]:rounded-l-none",
        "[.button-group_&:not(:first-child)]:border-l-0",
        "[.button-group_&:not(:last-child)]:rounded-r-none"
      )}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {noLayout ? (
        children
      ) : (
        <div
          className={clsx(
            "flex items-center justify-center space-x-1",
            size === "medium" && "px-4",
            size === "small" && "px-3"
          )}
        >
          {children}
        </div>
      )}
    </button>
  );
};
