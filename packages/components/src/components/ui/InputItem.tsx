import React from "react";
import { Path, UseFormRegister, FieldValues } from "react-hook-form";

export function InputItem<T extends FieldValues>({
  name,
  label,
  type,
  register,
}: {
  name: Path<T>;
  label: string;
  type: "number" | "text" | "color";
  register: UseFormRegister<T>;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-gray-600 mb-1">{label}</div>
      <input
        type={type}
        {...register(name, { valueAsNumber: type === "number" })}
        className="form-input max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
      />
    </label>
  );
}
