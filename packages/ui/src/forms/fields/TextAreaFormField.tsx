import { FieldPathByValue, FieldValues } from "react-hook-form";

import { FormField } from "../common/FormField.js";
import { CommonStringFieldProps } from "../common/types.js";
import {
  StyledTextArea,
  type StyledTextAreaProps,
} from "../styled/StyledTextArea.js";

export function TextAreaFormField<
  TValues extends FieldValues,
  TName extends FieldPathByValue<TValues, string> = FieldPathByValue<
    TValues,
    string
  >,
>({
  placeholder,
  rows,
  minRows,
  maxRows,
  ...fieldProps
}: CommonStringFieldProps<TValues, TName> &
  Pick<StyledTextAreaProps, "placeholder" | "rows" | "minRows" | "maxRows">) {
  return (
    <FormField {...fieldProps}>
      {(inputProps) => (
        <StyledTextArea
          {...inputProps}
          placeholder={placeholder}
          rows={rows}
          minRows={minRows}
          maxRows={maxRows}
        />
      )}
    </FormField>
  );
}
