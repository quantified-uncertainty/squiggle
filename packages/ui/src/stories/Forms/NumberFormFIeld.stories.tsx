import type { Meta, StoryObj } from "@storybook/react";

import { NumberFormField } from "../../index.js";
import { formDecorator } from "./withRHF.js";

const meta = {
  component: NumberFormField,
  decorators: [formDecorator],
} satisfies Meta<typeof NumberFormField>;
export default meta;
type Story = StoryObj<typeof NumberFormField>;

export const Default: Story = {
  args: {
    name: "x",
    label: "X value",
    description: "Any number.",
    placeholder: "Any number, e.g. 123",
  },
};

export const WithValidation: Story = {
  args: {
    ...Default.args,
    description: "Negative number.",
    placeholder: "-5",
    rules: {
      max: 0,
      required: true,
    },
  },
};
