import { FieldValues } from "react-hook-form";

import { FormField, FormFieldProps } from "../common/FormField.js";
import { StyledInput, type StyledInputProps } from "../styled/StyledInput.js";

type Props<T extends FieldValues> = Omit<FormFieldProps<T>, "children"> &
  Pick<StyledInputProps, "size" | "placeholder">;

export function NumberFormField<T extends FieldValues>({
  placeholder,
  ...fieldProps
}: Props<T>) {
  return (
    // TODO - customize registerOptions to take `valueAsNumber: true`
    <FormField {...fieldProps}>
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
