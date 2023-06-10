import { ReactNode } from "react";
import {
  Controller,
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  RegisterOptions,
  useFormContext,
} from "react-hook-form";

import { WithRHFError } from "./FormInput.js";

export type Props<T extends FieldValues> = {
  name: FieldPath<T>;
  rules?: Omit<
    RegisterOptions<T>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
  >;
  children: (props: ControllerRenderProps<T>) => ReactNode;
};

// Helper component for custom controlled react-hook-form connected components.
export function ControlledFormInput<T extends FieldValues>({
  name,
  rules,
  children,
}: Props<T>) {
  const { control } = useFormContext<T>();

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
