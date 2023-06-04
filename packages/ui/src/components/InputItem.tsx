import { clsx } from "clsx";
import { Path, UseFormRegister, FieldValues } from "react-hook-form";
import { Labeled } from "./Labeled.js";

type Size = "small" | "normal";

export type Props<T extends FieldValues, Other extends {} = {}> = {
  name: Path<T>;
  label?: string;
  type: "number" | "text" | "color";
  register: UseFormRegister<T>;
  disabled?: boolean;
  fixed?: string | number;
  size?: Size;
} & Other;

export function InputItem<T extends FieldValues, Other extends {} = {}>({
  name,
  label,
  type,
  register,
  disabled,
  fixed,
  size = "normal",
  ...other
}: Props<T, Other>) {
  disabled ??= fixed !== undefined;

  const input = (
    <input
      type={type}
      disabled={disabled}
      defaultValue={fixed}
      {...register(name, { valueAsNumber: type === "number" })}
      {...other}
      className={clsx(
        "form-input block w-full max-w-lg sm:max-w-xs text-sm shadow-sm rounded-md border-slate-300 focus:ring-indigo-500 active:ring-indigo-500 focus:border-indigo-500 active:border-indigo-500 placeholder:text-slate-300",
        size === "normal" ? "h-10" : "h-8",
        disabled && "text-slate-400"
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
