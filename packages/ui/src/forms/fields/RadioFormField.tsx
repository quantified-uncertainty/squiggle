import { FieldValues } from "react-hook-form";

import {
  ControlledFormField,
  ControlledFormFieldProps,
} from "../common/ControlledFormField.js";
import { StyledRadio, type StyledRadioProps } from "../styled/StyledRadio.js";

type Props<T extends FieldValues> = Omit<
  ControlledFormFieldProps<T>,
  "children" | "inlineLabel"
> &
  Pick<StyledRadioProps, "options">;

export function RadioFormField<T extends FieldValues>({
  options,
  ...fieldProps
}: Props<T>) {
  return (
    <ControlledFormField {...fieldProps}>
      {({ onChange, value }) => (
        <StyledRadio value={value} onChange={onChange} options={options} />
      )}
    </ControlledFormField>
  );
}
