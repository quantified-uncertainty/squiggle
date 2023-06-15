import { clsx } from "clsx";
import { useId } from "react";

export type StyledRadioProps = {
  value?: string;
  options: {
    id: string;
    name: string;
    disabled?: boolean;
    tooltip?: string;
  }[];
  // do we need other fields, e.g. onBlur?
  onChange(newValue: string): void;
};

export function StyledRadio({ value, options, onChange }: StyledRadioProps) {
  const id = useId();

  return (
    <div className="flex items-center gap-3">
      {options.map((option) => {
        const htmlId = `${id}@${option.id}`;
        return (
          <div key={option.id} className="flex items-center gap-1 group">
            <input
              id={htmlId}
              type="radio"
              onChange={() => onChange(option.id)}
              checked={option.id === value}
              className={clsx(
                "form-radio focus:ring-transparent text-indigo-500",
                option.disabled ? "cursor-not-allowed" : "cursor-pointer"
              )}
              disabled={option.disabled}
            />
            <label
              htmlFor={htmlId}
              title={option.tooltip}
              className={clsx(
                "text-sm font-medium",
                option.disabled
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600  group-hover:text-gray-900 cursor-pointer"
              )}
            >
              {option.name}
            </label>
          </div>
        );
      })}
    </div>
  );
}
