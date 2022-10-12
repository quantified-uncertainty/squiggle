import clsx from "clsx";
import React from "react";
import { Path, UseFormRegister, FieldValues } from "react-hook-form";

export function Checkbox<T extends FieldValues>({
  name,
  label,
  register,
  disabled,
  tooltip,
}: {
  name: Path<T>;
  label: string;
  register: UseFormRegister<T>;
  disabled?: boolean;
  tooltip?: string;
}) {
  return (
    <label className="flex items-center" title={tooltip}>
      <input
        type="checkbox"
        disabled={disabled}
        {...register(name)}
        className="form-checkbox focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
      />
      {/* Clicking on the div makes the checkbox lose focus while mouse button is pressed, leading to annoying blinking; I couldn't figure out how to fix this. */}
      <div
        className={clsx(
          "ml-3 text-sm font-medium",
          disabled ? "text-gray-400" : "text-gray-700"
        )}
      >
        {label}
      </div>
    </label>
  );
}
