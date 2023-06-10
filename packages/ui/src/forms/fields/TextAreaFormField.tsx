import { FieldValues } from "react-hook-form";

import { FormField, FormFieldProps } from "../common/FormField.js";
import {
  StyledTextArea,
  type StyledTextAreaProps,
} from "../styled/StyledTextArea.js";

type Props<T extends FieldValues> = Omit<
  FormFieldProps<T>,
  "children" | "inlineLabel"
> &
  Pick<StyledTextAreaProps, "placeholder">;

export function TextAreaFormField<T extends FieldValues>({
  placeholder,
  ...fieldProps
}: Props<T>) {
  return (
    <FormField {...fieldProps}>
      {(inputProps) => (
        <StyledTextArea {...inputProps} placeholder={placeholder} />
      )}
    </FormField>
  );
}
