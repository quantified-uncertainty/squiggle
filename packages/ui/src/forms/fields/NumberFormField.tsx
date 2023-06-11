import { FieldPath, FieldValues } from "react-hook-form";

import { FormField } from "../common/FormField.js";
import { CommonNumberFieldProps } from "../common/types.js";
import { StyledInput, type StyledInputProps } from "../styled/StyledInput.js";

export function NumberFormField<
  TValues extends FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>
>({
  placeholder,
  rules = {},
  ...fieldProps
}: CommonNumberFieldProps<TValues, TName> &
  Pick<StyledInputProps, "size" | "placeholder">) {
  return (
    <FormField {...fieldProps} rules={{ ...rules, valueAsNumber: true }}>
      {(inputProps) => (
        <StyledInput
          type="number"
          {...inputProps}
          placeholder={placeholder}
          autoComplete="off" // TODO - make customizable?
        />
      )}
    </FormField>
  );
}
