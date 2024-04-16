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
          "form-input block w-full rounded-md border-slate-300 text-sm shadow-sm placeholder:text-slate-300 focus:border-indigo-500 focus:ring-indigo-500 active:border-indigo-500 active:ring-indigo-500 disabled:text-slate-400",
          size === "normal" ? "h-10" : "h-8"
        )}
      />
    );
  }
);
