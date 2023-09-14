import { FieldPathByValue, FieldValues } from "react-hook-form";

import { ControlledFormField } from "../common/ControlledFormField.js";
import { CommonStringFieldProps } from "../common/types.js";
import { StyledColorInput } from "../styled/StyledColorInput.js";

export function ColorFormField<
  TValues extends FieldValues,
  TName extends FieldPathByValue<TValues, string> = FieldPathByValue<
    TValues,
    string
  >,
>({ ...fieldProps }: CommonStringFieldProps<TValues, TName>) {
  return (
    <ControlledFormField<TValues, string, TName> {...fieldProps} inlineLabel>
      {({ value, onChange }) => (
        <StyledColorInput value={value} onChange={onChange} />
      )}
    </ControlledFormField>
  );
}
