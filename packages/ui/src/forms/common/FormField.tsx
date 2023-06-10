import { ReactNode } from "react";
import {
  FieldPath,
  FieldValues,
  RegisterOptions,
  UseFormRegisterReturn,
} from "react-hook-form";

import { FormInput } from "./FormInput.js";
import { FieldLayout, type FormFieldLayoutProps } from "./FormFieldLayout.js";

export type FormFieldProps<T extends FieldValues> = FormFieldLayoutProps & {
  name: FieldPath<T>;
  registerOptions?: RegisterOptions<T>;
  children: (props: UseFormRegisterReturn<FieldPath<T>>) => ReactNode;
};

export function FormField<T extends FieldValues>({
  name,
  registerOptions,
  label,
  description,
  inlineLabel,
  children,
}: FormFieldProps<T>) {
  return (
    <FieldLayout
      label={label}
      description={description}
      inlineLabel={inlineLabel}
    >
      <FormInput name={name} rules={registerOptions}>
        {children}
      </FormInput>
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
