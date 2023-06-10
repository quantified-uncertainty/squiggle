import type { Meta, StoryObj } from "@storybook/react";

import { CheckboxFormField } from "../../index.js";
import { formDecorator } from "./withRHF.js";

const meta = {
  component: CheckboxFormField,
  decorators: [formDecorator],
} satisfies Meta<typeof CheckboxFormField>;
export default meta;
type Story = StoryObj<typeof CheckboxFormField>;

export const Default: Story = {
  args: {
    name: "fieldName",
    label: "Check me",
  },
};

export const Required: Story = {
  args: {
    ...Default.args,
    rules: {
      required: true,
    },
  },
};
