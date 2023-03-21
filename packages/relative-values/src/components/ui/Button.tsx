import clsx from "clsx";
import { ButtonHTMLAttributes, FC, forwardRef, PropsWithChildren } from "react";

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>(function Button({ className, ...props }, ref) {
  return (
    <button
      className={clsx(
        "bg-slate-100 border border-slate-300 rounded px-4 py-1 text-sm font-medium",
        props.disabled ? "opacity-50" : "hover:bg-slate-200",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
