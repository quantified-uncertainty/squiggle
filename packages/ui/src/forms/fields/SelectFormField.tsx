import Select, {
  type Props as SelectProps,
  type OptionProps,
  type SingleValueProps,
  components,
} from "react-select";
import AsyncSelect from "react-select/async";
import { FieldPathByValue, FieldValues, useFormContext } from "react-hook-form";

import { ControlledFormField } from "../common/ControlledFormField.js";
import { FormFieldLayoutProps } from "../common/FormFieldLayout.js";
import { ReactNode, createContext, useCallback, useContext } from "react";

type Equal<T1, T2> = T1 extends T2 ? (T2 extends T1 ? true : false) : false;

type OptionValueCodec<TValue, TOption> = {
  optionToFieldValue: (option: TOption) => NonNullable<TValue>;
  // Note that null result is allowed. See the comment below on null `selectValue`.
  fieldValueToOption: (value: NonNullable<TValue>) => TOption | null;
};

/* Useful for when form field's value doesn't match the option.
 * For example, since react-select requires options to be objects (not plain strings),
 * `SelectStringFormField` component uses these.
 * We allow these two props to be optional if and only if TOption and TValue have the same shape.
 */
type OptionValueCodecProps<TValue, TOption> = Equal<
  TOption,
  NonNullable<TValue>
> extends true
  ? Partial<OptionValueCodec<TValue, TOption>>
  : OptionValueCodec<TValue, TOption>;

type SelectFormFieldContextShape<TOption> = {
  renderOption?: (option: TOption) => ReactNode;
};

// `createContext` doesn't play well with generic shapes, and I'm not sure how risky a factory function would be, so this is not strongly typed.
const SelectFormFieldContext = createContext<
  SelectFormFieldContextShape<unknown>
>({
  renderOption: undefined,
});

function OptionComponent<TOption extends object>({
  children,
  ...props
}: OptionProps<TOption>) {
  const { renderOption } = useContext(SelectFormFieldContext);
  return (
    <components.Option {...props}>
      {renderOption ? renderOption(props.data) : children}
    </components.Option>
  );
}

function SingleValueComponent<TOption extends object>({
  children,
  ...props
}: SingleValueProps<TOption, false>) {
  const { renderOption } = useContext(SelectFormFieldContext);
  return (
    <components.SingleValue {...props}>
      {renderOption ? renderOption(props.data) : children}
    </components.SingleValue>
  );
}

export function SelectFormField<
  TValues extends FieldValues,
  TValue = never,
  TOption extends object = NonNullable<TValue>,
  TName extends FieldPathByValue<TValues, TValue> = FieldPathByValue<
    TValues,
    TValue
  >,
>({
  label,
  description,
  name,
  options,
  required = false,
  disabled,
  renderOption,
  async = false,
  loadOptions,
  getOptionLabel,
  getOptionValue,
  placeholder,
  optionToFieldValue: maybeOptionToFieldValue,
  fieldValueToOption: maybeFieldValueToOption,
}: Pick<FormFieldLayoutProps, "label" | "description"> & {
  name: TName;
  required?: boolean;
  disabled?: boolean;
  renderOption?: (option: TOption) => ReactNode;
} & (
    | {
        async?: false;
        loadOptions?: undefined;
        options: readonly TOption[];
      }
    | {
        async: true;
        loadOptions: (inputValue: string) => Promise<TOption[]>;
        options?: undefined;
      }
  ) &
  Pick<
    SelectProps<TOption, false>,
    "getOptionLabel" | "getOptionValue" | "placeholder"
  > &
  OptionValueCodecProps<TValue, TOption>) {
  const { resetField } = useFormContext<TValues>();

  const SelectComponent = async ? AsyncSelect : Select;

  const fieldValueToOption = useCallback(
    (value: NonNullable<TValue>): TOption | null => {
      if (value === undefined || value === null) {
        return null;
      }
      return (
        // if fieldValueToOption is not set, TValue == TOption
        maybeFieldValueToOption?.(value) ?? (value as unknown as TOption)
      );
    },
    [maybeFieldValueToOption]
  );

  const optionToFieldValue = useCallback(
    (option: TOption): NonNullable<TValue> => {
      return (
        // if optionToFieldValue is not set, TValue == TOption
        maybeOptionToFieldValue?.(option) ??
        (option as unknown as NonNullable<TValue>)
      );
    },
    [maybeOptionToFieldValue]
  );

  return (
    <SelectFormFieldContext.Provider
      value={{
        renderOption: renderOption as
          | ((option: unknown) => ReactNode)
          | undefined,
      }}
    >
      <ControlledFormField<TValues, TValue, TName>
        name={name}
        label={label}
        description={description}
        rules={{ required }}
      >
        {({ value, onChange }) => {
          /* `selectValue` can be null while `value` is not null.
           * This can happen if `fieldValueToOption` looks for an option in a fixed list, but value is not present there anymore.
           * This is bad: it means that the UI will show that nothing is selected, while the underlying form state still contains a value.
           * It might be useful to call `resetField` in that case, but it's risky since it can lead to an infinite loop.
           */
          const selectValue = fieldValueToOption(value);

          const selectOnChange = (option: TOption | null) => {
            if (option) {
              onChange(optionToFieldValue(option));
            } else {
              resetField(name);
            }
          };

          return (
            <SelectComponent<TOption>
              components={{
                Option: OptionComponent,
                SingleValue: SingleValueComponent,
              }}
              value={selectValue}
              onChange={selectOnChange}
              options={options}
              loadOptions={loadOptions}
              defaultOptions={async ? true : undefined}
              placeholder={placeholder}
              isDisabled={disabled}
              isClearable={!required}
              getOptionLabel={getOptionLabel}
              getOptionValue={getOptionValue}
              styles={{
                // TODO - only when in modal? boolean prop?
                menuPortal: (base) => ({ ...base, zIndex: 100 }),
                input: (base) => ({
                  ...base,
                  "input:focus": {
                    boxShadow: "none",
                  },
                  className: "text-sm placeholder:text-slate-300",
                }),
                control: (provided, state) => ({
                  ...provided,
                  minHeight: "10px",
                  height: "34px",
                  borderColor: state.isFocused
                    ? "#6610f2"
                    : provided.borderColor,
                  "&:hover": {
                    borderColor: state.isFocused
                      ? "#6610f2"
                      : provided.borderColor,
                  },
                  borderRadius: "0.375rem",
                }),
                option: (provided) => ({
                  ...provided,
                  fontSize: "0.875rem",
                }),
                placeholder: (provided) => ({
                  ...provided,
                  color: "#93C5FD",
                }),
              }}
              menuPortalTarget={
                typeof document === "undefined" ? undefined : document.body
              }
            />
          );
        }}
      </ControlledFormField>
    </SelectFormFieldContext.Provider>
  );
}
