import { FieldPath, FieldValues } from "react-hook-form";

import { ControlledFormField } from "../common/ControlledFormField.js";
import { StyledColorInput } from "../styled/StyledColorInput.js";
import { CommonStringFieldProps } from "../common/types.js";

export function ColorFormField<
  TValues extends FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>
>({ ...fieldProps }: CommonStringFieldProps<TValues, TName>) {
  return (
    <ControlledFormField {...fieldProps} inlineLabel>
      {({ value, onChange }) => (
        <StyledColorInput value={value} onChange={onChange} />
      )}
    </ControlledFormField>
  );
}
