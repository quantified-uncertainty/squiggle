import { FieldValues } from "react-hook-form";

import {
  ControlledFormField,
  ControlledFormFieldProps,
} from "../common/ControlledFormField.js";
import { StyledColorInput } from "../styled/StyledColorInput.js";

type Props<T extends FieldValues> = Omit<
  ControlledFormFieldProps<T>,
  "children" | "inlineLabel"
>;

export function ColorFormField<T extends FieldValues>({
  ...fieldProps
}: Props<T>) {
  return (
    <ControlledFormField {...fieldProps} inlineLabel>
      {({ value, onChange }) => (
        <StyledColorInput value={value} onChange={onChange} />
      )}
    </ControlledFormField>
  );
}
