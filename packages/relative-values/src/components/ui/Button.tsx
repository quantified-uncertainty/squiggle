import clsx from "clsx";
import { ButtonHTMLAttributes, FC, forwardRef, PropsWithChildren } from "react";

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  return (
    <button
      className={clsx(
        "bg-gray-100 border border-gray-300 shadow rounded px-4 py-1 text-sm font-medium",
        props.disabled ? "opacity-50" : "hover:bg-gray-200",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
