import { useEffect } from "react";
import {
  FieldPathByValue,
  FieldValues,
  UseFormReturn,
  useFormContext,
  useWatch,
} from "react-hook-form";

import { TextFormField } from "@quri/ui";

// Types here are a bit messy but should be safe in practice.
export function useDashifyFormField<
  TValues extends FieldValues,
  TName extends FieldPathByValue<
    TValues,
    string | undefined
  > = FieldPathByValue<TValues, string | undefined>,
>(form: UseFormReturn<TValues, unknown>, field: TName) {
  useWatch<TValues, TName>({ name: field });
  // We discard useWatch result (use it for subscription only) and rely on form value instead.
  // useWatch result can be stale and cause infinite loops.
  const value = form.getValues(field);

  useEffect(() => {
    if (typeof value === "string" && value.includes(" ")) {
      const patchedValue = String(value).replaceAll(" ", "-");
      // TName definition should make this safe
      form.setValue(field, patchedValue as any);
      form.trigger(field);
    }
  }, [value, form, field]);
}

export function SlugFormField<
  TValues extends FieldValues = never,
  TName extends FieldPathByValue<
    TValues,
    string | undefined
  > = FieldPathByValue<TValues, string | undefined>,
>({
  name,
  example,
  label,
  placeholder,
  size,
}: {
  name: TName;
  example?: string;
  label: string;
  placeholder?: string;
  size?: "small" | "normal";
}) {
  const form = useFormContext<TValues>();

  useDashifyFormField(form, name);

  const description =
    "Must be alphanumerical, with no spaces." +
    (example ? ` Example: ${example}` : "");

  return (
    <TextFormField
      name={name}
      description={description}
      label={label}
      placeholder={placeholder}
      size={size}
      rules={{
        pattern: {
          value: /^[\w-]+$/,
          message: description,
        },
        required: true,
      }}
    />
  );
}
