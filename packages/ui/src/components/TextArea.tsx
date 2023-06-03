import { clsx } from "clsx";
import { Path, UseFormRegister, FieldValues } from "react-hook-form";
import ImportedTextareaAutosize from "react-textarea-autosize";

import { Labeled } from "./Labeled.js";

// hack
const TextareaAutosize =
  ImportedTextareaAutosize as any as typeof ImportedTextareaAutosize.default;

export type Props<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  register: UseFormRegister<T>;
  disabled?: boolean;
  placeholder?: string;
};

export function TextArea<T extends FieldValues>({
  name,
  label,
  register,
  disabled,
  placeholder,
}: Props<T>) {
  const input = (
    <TextareaAutosize
      disabled={disabled}
      placeholder={placeholder}
      {...register(name)}
      className={clsx(
        "form-input block w-full text-sm shadow-sm rounded-md border-gray-300 focus:ring-indigo-500 active:ring-indigo-500 focus:border-indigo-500 active:border-indigo-500",
        disabled && "text-gray-400"
      )}
    />
  );

  return label === undefined ? (
    input
  ) : (
    <Labeled label={label} disabled={disabled}>
      {input}
    </Labeled>
  );
}
