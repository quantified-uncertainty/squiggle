import { clsx } from "clsx";
import { forwardRef, TextareaHTMLAttributes } from "react";
import TextareaAutosize from "react-textarea-autosize";

export type StyledTextAreaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "className" | "style"
>;

export const StyledTextArea = forwardRef<
  HTMLTextAreaElement,
  StyledTextAreaProps
>(function StyledTextArea(props, ref) {
  return (
    <TextareaAutosize
      ref={ref}
      {...props}
      className={clsx(
        "form-input block w-full rounded-sm border-gray-300 text-sm shadow-sm placeholder:text-gray-300 focus:border-blue-500 focus:ring-blue-500 active:border-blue-500 active:ring-blue-500"
        // disabled && "text-gray-400"
      )}
    />
  );
});
