import { FieldPath, FieldValues } from "react-hook-form";

import { FormField } from "../common/FormField.js";
import { CommonStringFieldProps } from "../common/types.js";
import { StyledInput, type StyledInputProps } from "../styled/StyledInput.js";

export function TextFormField<
  TValues extends FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>
>({
  placeholder,
  size,
  ...fieldProps
}: CommonStringFieldProps<TValues, TName> &
  Pick<StyledInputProps, "size" | "placeholder">) {
  return (
    <FormField {...fieldProps}>
      {(inputProps) => (
        <StyledInput
          type="text"
          {...inputProps}
          placeholder={placeholder}
          size={size}
          autoComplete="off" // TODO - make customizable?
        />
      )}
    </FormField>
  );
}
