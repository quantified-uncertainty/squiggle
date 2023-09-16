import {
  ControllerRenderProps,
  FieldPath,
  FieldPathByValue,
  FieldValues,
  RegisterOptions,
} from "react-hook-form";
import { FormFieldLayoutProps } from "./FormFieldLayout.js";

type StringRules<
  TValues extends FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>,
> = Omit<
  RegisterOptions<TValues, TName>,
  // should this also exclude min/max?
  "valueAsNumber" | "valueAsDate" | "setValueAs"
>;

type NumberRules<
  TValues extends FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>,
> = Omit<StringRules<TValues, TName>, "pattern">; // should this also exclude maxLength?

// These types is useful for specific field/*FormField declarations.
export type CommonStringFieldProps<
  TValues extends FieldValues,
  TName extends FieldPathByValue<TValues, string> = FieldPathByValue<
    TValues,
    string
  >,
> = Omit<FormFieldLayoutProps, "inlineLabel"> & {
  name: TName;
  rules?: StringRules<TValues, TName>;
};

export type CommonNumberFieldProps<
  TValues extends FieldValues,
  TName extends FieldPathByValue<
    TValues,
    number | undefined
  > = FieldPathByValue<TValues, number | undefined>,
> = Omit<FormFieldLayoutProps, "inlineLabel"> & {
  name: TName;
  rules?: NumberRules<TValues, TName>;
};

export type CommonUnknownFieldProps<
  TValues extends FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>,
> = Omit<FormFieldLayoutProps, "inlineLabel"> & {
  name: TName;
  // TODO - allow more rules?
  rules?: Pick<RegisterOptions<TValues, TName>, "required" | "validate">;
};

export type PatchedControllerRenderProps<
  TValues extends FieldValues,
  TValueType,
  TName extends FieldPathByValue<TValues, TValueType> = FieldPathByValue<
    TValues,
    TValueType
  >,
> = Omit<ControllerRenderProps<TValues, TName>, "onChange"> & {
  onChange: (event: TValueType) => void;
};
