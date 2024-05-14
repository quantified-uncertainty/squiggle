import { forwardRef, InputHTMLAttributes } from "react";

export const StyledCheckbox = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, "className">
>(function StyledCheckbox(props, ref) {
  return (
    <input
      type="checkbox"
      ref={ref}
      {...props}
      className="form-checkbox h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
    />
  );
});
