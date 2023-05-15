import { clsx } from "clsx";
import { Path, UseFormRegister, FieldValues } from "react-hook-form";

export type Props<T extends FieldValues, Other extends {} = {}> = {
  name: Path<T>;
  label?: string;
  type: "number" | "text" | "color";
  register: UseFormRegister<T>;
  disabled?: boolean;
  fixed?: string | number;
} & Other;

export function InputItem<T extends FieldValues, Other extends {} = {}>({
  name,
  label,
  type,
  register,
  disabled,
  fixed,
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
        "form-input max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md",
        disabled && "text-gray-400"
      )}
    />
  );

  return label === undefined ? (
    input
  ) : (
    <label className="block">
      <div
        className={clsx(
          "text-sm font-medium mb-1",
          disabled ? "text-gray-400" : "text-gray-600"
        )}
      >
        {label}
      </div>
      {input}
    </label>
  );
}
