import { clsx } from "clsx";
import { FC } from "react";

import { FieldPathByValue, FieldValues } from "react-hook-form";
import { FormFieldLayoutProps } from "../common/FormFieldLayout.js";
import { SelectFormField } from "./SelectFormField.js";

type Size = "small" | "normal";

const TextOption: FC<{ text: string; size: Size }> = ({ text, size }) => {
  return <div className={clsx(size === "small" && "text-sm")}>{text}</div>;
};

export function SelectStringFormField<
  TValues extends FieldValues,
  TValueType extends string | null = string | null, // can be configured with const string union for stricter types
  TName extends FieldPathByValue<TValues, TValueType> = FieldPathByValue<
    TValues,
    TValueType
  >,
>({
  options,
  size = "normal",
  ...props
}: Pick<FormFieldLayoutProps, "label" | "description"> & {
  name: TName;
  size?: Size;
  options: NonNullable<TValueType>[];
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <SelectFormField<
      TValues,
      TValueType,
      { value: NonNullable<TValueType>; label: string }
    >
      {...props}
      size={size}
      options={options.map((value) => ({ value, label: value }))}
      optionToFieldValue={(option) => option.value}
      fieldValueToOption={(value) => ({ value, label: value })}
      renderOption={(option) => <TextOption text={option.label} size={size} />}
    />
  );
}
