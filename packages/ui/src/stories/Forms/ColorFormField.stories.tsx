import type { Meta, StoryObj } from "@storybook/react";

import { ColorFormField } from "../../index.js";
import { formDecorator } from "./withRHF.js";

const meta = {
  component: ColorFormField,
  decorators: [formDecorator],
} satisfies Meta<typeof ColorFormField>;
export default meta;
type Story = StoryObj<typeof ColorFormField>;

export const Default: Story = {
  args: {
    name: "myColor",
    label: "My color",
  },
};

export const RedOnly: Story = {
  args: {
    ...Default.args,
    label: "Red",
    rules: {
      pattern: {
        value: /^#ff/,
        message: "Must have FF in red component",
      },
    },
  },
};
