import type { Meta, StoryObj } from "@storybook/react";

import { StyledInput } from "../../index.js";

const meta = { component: StyledInput } satisfies Meta<typeof StyledInput>;
export default meta;
type Story = StoryObj<typeof StyledInput>;

export const Default: Story = {
  args: {
    name: "fieldName",
  },
};

export const Number: Story = {
  args: {
    name: "fieldName",
    type: "number",
    defaultValue: "123",
  },
};

export const WithPlaceholder: Story = {
  args: {
    name: "fieldName",
    placeholder: "Placeholder...",
  },
};

/**
 * Same height as 32px `<Button />`.
 */
export const Small: Story = {
  args: {
    name: "fieldName",
    size: "small",
    placeholder: "Small",
  },
};

export const Disabled: Story = {
  args: {
    name: "fieldName",
    disabled: true,
  },
};
