"use client";
import { ReactNode } from "react";
import {
  FieldPath,
  FieldValues,
  RegisterOptions,
  UseFormRegisterReturn,
  useFormContext,
} from "react-hook-form";

import { WithRHFError } from "./WithRHFError.js";

type Props<
  TValues extends FieldValues,
  TFieldName extends FieldPath<TValues> = FieldPath<TValues>,
> = {
  name: TFieldName;
  rules?: RegisterOptions<TValues, TFieldName>;
  children: (props: UseFormRegisterReturn<TFieldName>) => ReactNode;
};

// Helper component for various react-hook-form connected components.
export function FormInput<
  TValues extends FieldValues,
  TFieldName extends FieldPath<TValues> = FieldPath<TValues>,
>({ name, rules, children }: Props<TValues, TFieldName>) {
  const { register } = useFormContext<TValues>();

  return (
    <WithRHFError<TValues, TFieldName> name={name}>
      {children(register(name, rules))}
    </WithRHFError>
  );
}

/* Usage example:
 *
 * <FormInput name="foo">
 *   {(props) => <StyledInput type="text" {...props} />}
 * </FormInput>
 */
