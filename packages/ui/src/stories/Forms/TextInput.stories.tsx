import type { Meta, StoryObj } from "@storybook/react";

import { TextInput } from "../../index.js";
import { withRHF } from "./withRHF.js";

const meta = { component: TextInput } satisfies Meta<typeof TextInput>;
export default meta;
type Story = StoryObj<typeof TextInput>;

export const Default: Story = {
  render: withRHF((args, register) => (
    <TextInput {...args} register={register} />
  )),
  args: {
    name: "fieldName",
    label: "Input label",
  },
};

export const WithPlaceholder: Story = {
  render: withRHF((args, register) => (
    <TextInput {...args} register={register} />
  )),
  args: {
    name: "fieldName",
    label: "Label",
    placeholder: "Placeholder...",
  },
};

/**
 * Same height as 32px `<Button />`.
 */
export const Small: Story = {
  render: withRHF((args, register) => (
    <TextInput {...args} register={register} />
  )),
  args: {
    name: "fieldName",
    label: "Label",
    size: "small",
    placeholder: "Small",
  },
};

export const WithoutLabel: Story = {
  render: withRHF((args, register) => (
    <TextInput {...args} register={register} />
  )),
  args: {
    name: "fieldName",
  },
};

export const Disabled: Story = {
  render: withRHF((args, register) => (
    <TextInput {...args} register={register} />
  )),
  args: {
    name: "fieldName",
    label: "Input label",
    disabled: true,
  },
};
