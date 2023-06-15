import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

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
          "form-input block w-full text-sm shadow-sm rounded-md border-slate-300 focus:ring-indigo-500 active:ring-indigo-500 focus:border-indigo-500 active:border-indigo-500 placeholder:text-slate-300 disabled:text-slate-400",
          size === "normal" ? "h-10" : "h-8"
        )}
      />
    );
  }
);
