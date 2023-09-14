"use client";
import { ReactNode } from "react";
import {
  Controller,
  FieldPathByValue,
  FieldValues,
  UseControllerProps,
  useFormContext,
} from "react-hook-form";

import { WithRHFError } from "./WithRHFError.js";
import { PatchedControllerRenderProps } from "./types.js";

type Props<
  TValues extends FieldValues,
  TValueType,
  TName extends FieldPathByValue<TValues, TValueType> = FieldPathByValue<
    TValues,
    TValueType
  >,
> = {
  name: TName;
  rules?: UseControllerProps<TValues, TName>["rules"];
  children: (
    props: PatchedControllerRenderProps<TValues, TValueType, TName>
  ) => ReactNode;
};

// Helper component for custom controlled react-hook-form connected components.
export function ControlledFormInput<
  TValues extends FieldValues,
  TValueType,
  TName extends FieldPathByValue<TValues, TValueType> = FieldPathByValue<
    TValues,
    TValueType
  >,
>({ name, rules, children }: Props<TValues, TValueType, TName>) {
  const { control } = useFormContext<TValues>();

  return (
    <WithRHFError name={name}>
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field }) => (
          <div>
            {children(
              // our controller components don't allow ChangeEvent events;
              // also, Typescript is not smart enough to infer that FieldPathByValue is the inverse of FieldPathValue
              field as Omit<typeof field, "onChange"> & {
                onChange: (event: TValueType) => void;
              }
            )}
          </div>
        )}
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
