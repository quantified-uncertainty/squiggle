import React from "react";
import { Path, UseFormRegister } from "react-hook-form";

export function Checkbox<T>({
  name,
  label,
  register,
}: {
  name: Path<T>;
  label: string;
  register: UseFormRegister<T>;
}) {
  return (
    <label className="flex items-center">
      <input
        type="checkbox"
        {...register(name)}
        className="form-checkbox focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
      />
      {/* Clicking on the div makes the checkbox lose focus while mouse button is pressed, leading to annoying blinking; I couldn't figure out how to fix this. */}
      <div className="ml-3 text-sm font-medium text-gray-700">{label}</div>
    </label>
  );
}
