import { ButtonHTMLAttributes, FC, forwardRef, PropsWithChildren } from "react";

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>((props, ref) => {
  return (
    <button
      className="bg-gray-100 hover:bg-gray-200 border border-gray-300 shadow rounded px-6 py-1" // TODO - merge className from props
      ref={ref}
      {...props}
    />
  );
});
