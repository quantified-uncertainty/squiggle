import { FieldPath, FieldValues } from "react-hook-form";

import { ControlledFormField } from "../common/ControlledFormField.js";
import { CommonUnknownFieldProps } from "../common/types.js";
import { StyledRadio, type StyledRadioProps } from "../styled/StyledRadio.js";

export function RadioFormField<
  TValues extends FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>,
>({
  options,
  ...fieldProps
}: CommonUnknownFieldProps<TValues, TName> &
  Pick<StyledRadioProps, "options">) {
  return (
    <ControlledFormField {...fieldProps}>
      {({ onChange, value }) => (
        <StyledRadio value={value} onChange={onChange} options={options} />
      )}
    </ControlledFormField>
  );
}
