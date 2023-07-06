import { TextareaHTMLAttributes, forwardRef } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { clsx } from "clsx";

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
        "form-input block w-full text-sm shadow-sm rounded-md border-slate-300 focus:ring-indigo-500 active:ring-indigo-500 focus:border-indigo-500 active:border-indigo-500 placeholder:text-slate-300"
        // disabled && "text-slate-400"
      )}
    />
  );
});
