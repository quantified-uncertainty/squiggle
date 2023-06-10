import { FieldValues } from "react-hook-form";

import { FormField, FormFieldProps } from "../common/FormField.js";
import { StyledInput, type StyledInputProps } from "../styled/StyledInput.js";

type Props<T extends FieldValues> = Omit<
  FormFieldProps<T>,
  "children" | "inlineLabel"
> &
  Pick<StyledInputProps, "size" | "placeholder">;

export function TextFormField<T extends FieldValues>({
  placeholder,
  ...fieldProps
}: Props<T>) {
  return (
    <FormField {...fieldProps}>
      {(inputProps) => (
        <StyledInput
          type="text"
          {...inputProps}
          placeholder={placeholder}
          autoComplete="off" // TODO - make customizable?
        />
      )}
    </FormField>
  );
}
