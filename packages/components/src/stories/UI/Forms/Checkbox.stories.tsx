import type { Meta, StoryObj } from "@storybook/react";

import { Checkbox } from "../../../components/ui/Checkbox.js";
import { withRHF } from "./withRHF.js";
import React from "react";

const meta = {
  component: Checkbox,
} satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Unchecked: Story = {
  render: withRHF((args, register) => (
    <Checkbox {...args} register={register} />
  )),
  args: {
    name: "fieldName",
    label: "Unchecked initially",
  },
};

export const Checked: Story = {
  render: withRHF(
    (args, register) => <Checkbox {...(args as any)} register={register} />,
    { fieldName: true }
  ),
  args: {
    name: "fieldName",
    label: "Checked initially",
  },
};

export const Fixed: Story = {
  render: withRHF((args, register) => (
    <Checkbox {...args} register={register} />
  )),
  args: {
    name: "fieldName",
    label: "Checkbox text",
    fixed: true,
  },
};

export const WithTooltip: Story = {
  render: withRHF((args, register) => (
    <Checkbox {...args} register={register} />
  )),
  args: {
    name: "fieldName",
    label: "Checkbox text",
    fixed: true,
    tooltip: "This text shows on hover",
  },
};
