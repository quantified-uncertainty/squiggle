import { FieldPathByValue, FieldValues } from "react-hook-form";

import { ControlledFormField } from "../common/ControlledFormField.js";
import { CommonNumberFieldProps } from "../common/types.js";
import { StyledInput, type StyledInputProps } from "../styled/StyledInput.js";

export function NumberFormField<
  TValues extends FieldValues,
  TName extends FieldPathByValue<
    TValues,
    number | undefined
  > = FieldPathByValue<TValues, number | undefined>,
>({
  placeholder,
  rules = {},
  ...fieldProps
}: CommonNumberFieldProps<TValues, TName> &
  Pick<StyledInputProps, "size" | "placeholder">) {
  // `valueAsNumber` from react-hook-form doesn't play well with zod, and `setValueAs` is problematic too, so we have to use controlled component instead.
  // Also, this lets us to disallow non-numerical characters.
  // See also: https://github.com/orgs/react-hook-form/discussions/6980, https://github.com/orgs/react-hook-form/discussions/7128
  return (
    <ControlledFormField {...fieldProps} rules={rules}>
      {({ onChange, onBlur, value }) => {
        return (
          <StyledInput
            // type="number" is kinda broken in Firefox.
            // See also: https://news.ycombinator.com/item?id=32852643
            // We implement something number-like manually here.
            type="text"
            onBlur={onBlur}
            // This is not a controlled component - controlled mode caused issues with parsed numerical value being passed back to input, e.g. `-0` was normalizing to `0`.
            defaultValue={value}
            onKeyDown={(e) => {
              if (
                // if Ctrl or Meta key is down, it's probably a cut/paste event, we shouldn't block it
                !e.ctrlKey &&
                !e.metaKey &&
                e.key.length === 1 && // We don't want to block modifier keys.
                !e.key.match(/^[0-9.-]$/) // block everything that's not a digit, '.' or '-'.
              ) {
                e.preventDefault();
              }
            }}
            onChange={(e) => {
              const str = e.target.value;
              if (str.match(/^\s*$/)) {
                // This will make zod fall back to its default value.
                // Note that this violates react-hook-form "should not be undefined". But it seems to do what we want.
                onChange(undefined);
              } else {
                // On invalid inputs, zod will say "Expected number, received nan".
                const newValue = +e.target.value;
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
