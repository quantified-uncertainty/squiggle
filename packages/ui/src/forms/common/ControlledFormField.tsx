import { ReactNode } from "react";
import {
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  RegisterOptions,
} from "react-hook-form";

import { ControlledFormInput } from "./ControlledFormInput.js";
import { FieldLayout, FormFieldLayoutProps } from "./FormFieldLayout.js";

export type ControlledFormFieldProps<
  TValues extends FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>
> = FormFieldLayoutProps & {
  name: TName;
  rules?: RegisterOptions<TValues, TName>;
  children: (props: ControllerRenderProps<TValues, TName>) => ReactNode;
};

export function ControlledFormField<
  TValues extends FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>
>({
  name,
  rules,
  label,
  description,
  inlineLabel,
  children,
}: ControlledFormFieldProps<TValues, TName>) {
  return (
    <FieldLayout
      label={label}
      description={description}
      inlineLabel={inlineLabel}
    >
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
 *     props => <StyledInput type="text" {...props} />
 * }</FormField>
 */
