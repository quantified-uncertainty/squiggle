import { FieldPath, FieldValues } from "react-hook-form";

import { ControlledFormField } from "../common/ControlledFormField.js";
import { CommonNumberFieldProps } from "../common/types.js";
import { StyledInput, type StyledInputProps } from "../styled/StyledInput.js";

export function NumberFormField<
  TValues extends FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>
>({
  placeholder,
  rules = {},
  ...fieldProps
}: CommonNumberFieldProps<TValues, TName> &
  Pick<StyledInputProps, "size" | "placeholder">) {
  // `valueAsNumber` in react-hook-form doesn't play well with zod, and `setValueAs` is problematic too, so we have to use controlled component instead.
  // Also, this lets us to disallow non-numerical characters.
  // See also: https://github.com/orgs/react-hook-form/discussions/6980, https://github.com/orgs/react-hook-form/discussions/7128
  return (
    <ControlledFormField {...fieldProps} rules={rules}>
      {({ onChange, onBlur, value }) => {
        return (
          <StyledInput
            // type="number" is broken in Firefox.
            // See also: https://news.ycombinator.com/item?id=32852643
            type="text"
            onBlur={onBlur}
            value={value === null ? "" : value}
            onChange={(e) => {
              const str = e.target.value;
              if (str.match(/^\s*$/)) {
                onChange(null);
              } else if (str === "-") {
                onChange(str); // this won't pass zod validation, but it will affect `value` field
              } else {
                const newValue = +e.target.value;
                if (Number.isNaN(newValue)) {
                  return; // don't allow edit
                }
                onChange(newValue);
              }
            }}
            placeholder={placeholder}
            autoComplete="off" // TODO - make customizable?
          />
        );
      }}
    </ControlledFormField>
  );
}
