import { clsx } from "clsx";
import { FieldValues, Path, UseFormRegister } from "react-hook-form";

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
    disabled?: boolean;
    tooltip?: string;
  }[];
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-sm font-medium text-gray-600">{label}:</div>
      {options.map((option) => {
        const htmlId = `${name}@${option.id}`;
        return (
          <div key={option.id} className="flex items-center gap-1 group">
            <input
              id={htmlId}
              type="radio"
              {...register(name)}
              value={option.id}
              className={clsx(
                "form-radio focus:ring-transparent text-indigo-500",
                option.disabled ? "cursor-not-allowed" : "cursor-pointer"
              )}
              defaultChecked={option.id === initialId}
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
