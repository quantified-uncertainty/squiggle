import type { Meta, StoryObj } from "@storybook/react";
import { ComponentType } from "react";

import { NumberFormField } from "../../index.js";
import { formDecorator } from "./withRHF.js";

const meta = {
  component: NumberFormField,
  decorators: [
    formDecorator,
    (Story: ComponentType) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
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

export const Small: Story = {
  args: {
    ...Default.args,
    size: "small",
  },
};

export const WithTooltip: Story = {
  args: {
    ...Default.args,
    tooltip: "Tooltip text",
  },
};

export const RowLayout: Story = {
  args: {
    ...Default.args,
    tooltip: "Tooltip text",
    layout: "row",
  },
};
