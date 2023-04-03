import { clsx } from "clsx";
import React from "react";
import { Path, UseFormRegister, FieldValues } from "react-hook-form";

export function InputItem<T extends FieldValues>({
  name,
  label,
  type,
  register,
  disabled,
  fixed,
}: {
  name: Path<T>;
  label: string;
  type: "number" | "text" | "color";
  register: UseFormRegister<T>;
  disabled?: boolean;
  fixed?: string | number;
}) {
  disabled ??= fixed !== undefined;

  return (
    <label className="block">
      <div
        className={clsx(
          "text-sm font-medium mb-1",
          disabled ? "text-gray-400" : "text-gray-600"
        )}
      >
        {label}
      </div>
      <input
        type={type}
        disabled={disabled}
        defaultValue={fixed}
        {...register(name, { valueAsNumber: type === "number" })}
        className={clsx(
          "form-input max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md",
          disabled && "text-gray-400"
        )}
      />
    </label>
  );
}
