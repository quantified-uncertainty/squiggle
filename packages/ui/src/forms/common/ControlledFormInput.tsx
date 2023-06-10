import { ReactNode } from "react";
import {
  Controller,
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  UseControllerProps,
  useFormContext,
} from "react-hook-form";

import { WithRHFError } from "./FormInput.js";

type Props<
  TValues extends FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>
> = {
  name: TName;
  rules?: UseControllerProps<TValues, TName>["rules"];
  children: (props: ControllerRenderProps<TValues, TName>) => ReactNode;
};

// Helper component for custom controlled react-hook-form connected components.
export function ControlledFormInput<
  TValues extends FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>
>({ name, rules, children }: Props<TValues, TName>) {
  const { control } = useFormContext<TValues>();

  return (
    <WithRHFError name={name}>
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field }) => <div>{children(field) ?? null}</div>}
      />
    </WithRHFError>
  );
}

/* Usage example:
 *
 * <ControlledFormInput name="foo">
 *   {({ onChange, value }) => <MyComponent onChange={onChange} value={value} />}
 * </ControlledFormInput>
 */
