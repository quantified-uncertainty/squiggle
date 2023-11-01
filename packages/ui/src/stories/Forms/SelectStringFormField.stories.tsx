import type { Meta, StoryObj } from "@storybook/react";

import { SelectStringFormField } from "../../index.js";
import { formDecorator } from "./withRHF.js";

const meta = {
  component: SelectStringFormField,
  decorators: [formDecorator],
} satisfies Meta<typeof SelectStringFormField>;
export default meta;
type Story = StoryObj<typeof SelectStringFormField>;

export const Default: Story = {
  args: {
    name: "fieldName",
    label: "Select",
    options: ["option 1", "option 2"],
  },
};

export const Small: Story = {
  args: {
    name: "small",
    label: "Small select",
    options: ["option 1", "option 2"],
    size: "small",
  },
};

export const LongAndScrollable: Story = {
  args: {
    name: "fieldName",
    label: "Scrollable select",
    options: new Array(20).fill(null).map((_, i) => `Option ${i + 1}`),
  },
};

/** Form is initially not valid and there's no "X" clear button on the select. */
export const Required: Story = {
  args: {
    name: "fieldName",
    label: "Select",
    options: ["Option 1", "Option 2"],
    required: true,
  },
};
