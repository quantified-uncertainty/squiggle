import { ReactNode } from "react";
import {
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  RegisterOptions,
} from "react-hook-form";

import { ControlledFormInput } from "./ControlledFormInput.js";
import { FieldLayout, type FormFieldLayoutProps } from "./FormFieldLayout.js";

export type ControlledFormFieldProps<T extends FieldValues> =
  FormFieldLayoutProps & {
    name: FieldPath<T>;
    rules?: Omit<
      RegisterOptions<T>,
      "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
    >;
    children: (props: ControllerRenderProps<T>) => ReactNode;
  };

export function ControlledFormField<T extends FieldValues>({
  name,
  rules,
  label,
  description,
  inlineLabel,
  children,
}: ControlledFormFieldProps<T>) {
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
