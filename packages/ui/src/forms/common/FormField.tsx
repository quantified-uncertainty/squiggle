import { ReactNode } from "react";
import {
  FieldPath,
  FieldValues,
  RegisterOptions,
  UseFormRegisterReturn,
} from "react-hook-form";

import { FieldLayout, type FormFieldLayoutProps } from "./FormFieldLayout.js";
import { FormInput } from "./FormInput.js";

export type FormFieldProps<
  TValues extends FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>,
> = FormFieldLayoutProps & {
  name: TName;
  rules?: RegisterOptions<TValues, TName>; // more related than CommonFieldProps
  children: (props: UseFormRegisterReturn<TName>) => ReactNode;
};

export function FormField<
  TValues extends FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>,
>({
  name,
  rules,
  label,
  description,
  inlineLabel,
  standaloneLabel,
  children,
}: FormFieldProps<TValues, TName>) {
  return (
    <FieldLayout
      label={label}
      description={description}
      inlineLabel={inlineLabel}
      standaloneLabel={standaloneLabel}
    >
      <FormInput name={name} rules={rules}>
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
