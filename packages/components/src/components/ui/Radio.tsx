import { clsx } from "clsx";
import React from "react";
import { Path, UseFormRegister, FieldValues } from "react-hook-form";

export function Radio<T extends FieldValues>({
  name,
  label,
  register,
  initialId,
  options,
}: {
  name: Path<T>;
  label: string;
  register: UseFormRegister<T>;
  initialId: string;
  options: {
    id: string;
    name: string;
  }[];
}) {
  return (
    <div className="flex items-center gap-3">
      {options.map((option) => {
        const htmlId = `${name}@${option.id}`;
        return (
          <div key={option.id} className="flex items-center gap-1">
            <input
              id={htmlId}
              type="radio"
              {...register(name)}
              value={option.id}
              className="cursor-pointer"
              defaultChecked={option.id === initialId}
            />
            <label htmlFor={htmlId} className="cursor-pointer">
              {option.name}
            </label>
          </div>
        );
      })}
    </div>
  );
}
