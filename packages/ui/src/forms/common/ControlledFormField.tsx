import { ReactNode } from "react";
import {
  FieldPathByValue,
  FieldValues,
  RegisterOptions,
} from "react-hook-form";

import { ControlledFormInput } from "./ControlledFormInput.js";
import { FieldLayout, FormFieldLayoutProps } from "./FormFieldLayout.js";
import { PatchedControllerRenderProps } from "./types.js";

export type ControlledFormFieldProps<
  TValues extends FieldValues,
  TValueType = unknown,
  TName extends FieldPathByValue<TValues, TValueType> = FieldPathByValue<
    TValues,
    TValueType
  >,
> = FormFieldLayoutProps & {
  name: TName;
  rules?: RegisterOptions<TValues, TName>;
  children: (
    props: PatchedControllerRenderProps<TValues, TValueType, TName>
  ) => ReactNode;
};

export function ControlledFormField<
  TValues extends FieldValues,
  TValueType,
  TName extends FieldPathByValue<TValues, TValueType> = FieldPathByValue<
    TValues,
    TValueType
  >,
>({
  name,
  rules,
  children,
  ...layoutProps
}: ControlledFormFieldProps<TValues, TValueType, TName>) {
  return (
    <FieldLayout {...layoutProps}>
      <ControlledFormInput name={name} rules={rules}>
        {children}
      </ControlledFormInput>
    </FieldLayout>
  );
}

/*
 * Usage example:
 *
 * <FormField name="slug" label="Slug" description="Model slug">{
 *     props => <StyledInput {...props} />
 * }</FormField>
 */
