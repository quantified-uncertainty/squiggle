import type { Meta, StoryObj } from "@storybook/react";

import { SelectFormField } from "../../index.js";
import { formDecorator } from "./withRHF.js";

/**
 * Wrapper around [react-select](https://react-select.com/) for react-hook-form.
 *
 * Supports custom callback for rendering options.
 *
 * ## Type parameters
 *
 * This component is generic; its type parameters are:
 * 1. `TValues`, the react-hook-form values shape.
 * 2. `TValue`, the shape for the value on the form.
 * 3. `TOption`; defaults to non-nullable TValue if not set (see "Options and values") below.
 *
 * There's also a fourth parameter `TName`, but it's usually inferred.
 *
 * You should always pass at least `TValues` and `TValue`. (It's not possible to infer `TValue` because of Typescript limitations.)
 *
 * ## Options and values
 *
 * The tricky part about this component is that the value in the form and the option for react-select often have different shapes.
 *
 * For example, for a component that allows the user to select a group, you might want to store only group id in a form state, but show group name and number of members in the select component.
 *
 * To account for that, you can provide two props:
 * 1. `optionToFieldValue` prop which converts the selected option to the value that should be set in form values.
 * 2. `fieldValueToOption` prop for the reverse operation.
 *
 * The usual type for the option is `{ value: string, label: string }`, if the option should be rendered as a plain text. Otherwise, you can pass any JS object, in combination with:
 * - `components` prop to control how it will be rendered
 * - `getOptionLabel` to convert the option to the plain text
 * - `getOptionValue` to convert the option to the unique id
 *
 * `fieldValueToOption` is allowed to return `null`. This is useful when the list of allowed options is generated dynamically and the selected value can become invalid. In this case, you're encouraged to do _something_ about it. The common scenario is to reset the form's field to the null value, and maybe `console.warn` or show an error in the UI. See `<SelectCluster />` component in the Squiggle Hub source code for an example.
 *
 * If your values are strings and you don't need to customize how options look, consider using `<SelectStringFormField />` instead.
 */
const meta = {
  component: SelectFormField,
  decorators: [formDecorator],
} satisfies Meta<typeof SelectFormField>;
export default meta;
type Story = StoryObj<typeof SelectFormField>;

type Option = {
  value: string;
  label: string;
};

const options = [
  { value: "opt1", label: "Option 1" },
  { value: "opt2", label: "Option 2" },
];

export const Default: Story = {
  args: {
    name: "fieldName",
    label: "Select",
    options,
    optionToFieldValue: (option: Option) => option.value,
    fieldValueToOption: (value: string) =>
      options.find((option) => option.value === value),
  },
};

export const CustomRender: Story = {
  args: {
    name: "fieldName",
    label: "Select",
    options,
    renderOption: (option: Option) => (
      <div>
        <span>{option.label}</span>{" "}
        <span className="text-xs">({option.value})</span>
      </div>
    ),
    optionToFieldValue: (option: Option) => option.value,
    fieldValueToOption: (value: string) =>
      options.find((option) => option.value === value),
  },
};
