import { FieldValues } from "react-hook-form";

import {
  ControlledFormField,
  ControlledFormFieldProps,
} from "../common/ControlledFormField.js";
import { StyledCheckbox } from "../styled/StyledCheckbox.js";

type Props<T extends FieldValues> = Omit<
  ControlledFormFieldProps<T>,
  "children" | "inlineLabel"
>;

export function CheckboxFormField<T extends FieldValues>({
  ...fieldProps
}: Props<T>) {
  return (
    <ControlledFormField {...fieldProps} inlineLabel>
      {({ value, onChange }) => (
        <StyledCheckbox value={value} onChange={onChange} />
      )}
    </ControlledFormField>
  );
}
