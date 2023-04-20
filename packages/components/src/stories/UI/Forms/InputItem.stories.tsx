import type { Meta, StoryObj } from "@storybook/react";

import { InputItem } from "../../../components/ui/InputItem.js";
import { withRHF } from "./withRHF.js";
import React from "react";

const meta = {
  component: InputItem,
} satisfies Meta<typeof InputItem>;
export default meta;
type Story = StoryObj<typeof InputItem>;

export const TextInput: Story = {
  render: withRHF((args, register) => (
    <InputItem {...args} register={register} />
  )),
  args: {
    name: "fieldName",
    label: "Input label",
    type: "text",
  },
};

export const DisabledTextInput: Story = {
  render: withRHF((args, register) => (
    <InputItem {...args} register={register} />
  )),
  args: {
    name: "fieldName",
    label: "Input label",
    type: "text",
    disabled: true,
  },
};

export const NumberInput: Story = {
  render: withRHF((args, register) => (
    <InputItem {...args} register={register} />
  )),
  args: {
    name: "fieldName",
    label: "Input label",
    type: "number",
  },
};

export const ColorInput: Story = {
  render: withRHF((args, register) => (
    <InputItem {...args} register={register} />
  )),
  args: {
    name: "fieldName",
    label: "Input label",
    type: "color",
  },
};
