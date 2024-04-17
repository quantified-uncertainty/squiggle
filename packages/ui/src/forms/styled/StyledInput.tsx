import { clsx } from "clsx";
import { forwardRef, InputHTMLAttributes } from "react";

type Size = "small" | "normal";

export type StyledInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className" | "type" | "size"
> & {
  type?: "text" | "number";
  size?: Size;
};

export const StyledInput = forwardRef<HTMLInputElement, StyledInputProps>(
  function StyledInput({ size = "normal", type = "text", ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        {...props}
        className={clsx(
          "form-input block w-full rounded-sm border-gray-300 text-sm shadow-sm placeholder:text-gray-300 focus:border-blue-500 focus:ring-blue-500 active:border-blue-500 active:ring-blue-500 disabled:text-gray-400",
          size === "normal" ? "h-10" : "h-8"
        )}
      />
    );
  }
);
