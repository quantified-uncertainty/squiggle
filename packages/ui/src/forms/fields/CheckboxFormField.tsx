import { FieldPath, FieldValues } from "react-hook-form";

import { ControlledFormField } from "../common/ControlledFormField.js";
import { CommonUnknownFieldProps } from "../common/types.js";
import { StyledCheckbox } from "../styled/StyledCheckbox.js";

export function CheckboxFormField<
  TValues extends FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>,
>({ ...fieldProps }: CommonUnknownFieldProps<TValues, TName>) {
  return (
    <ControlledFormField {...fieldProps} inlineLabel>
      {({ value, onChange }) => (
        <StyledCheckbox checked={value} onChange={onChange} />
      )}
    </ControlledFormField>
  );
}
