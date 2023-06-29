import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "../components/Button.js";

const meta = { component: Button } satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Button",
  },
};

export const Primary: Story = {
  args: {
    children: "Button",
    theme: "primary",
  },
};

export const Disabled: Story = {
  args: {
    children: "Button",
    disabled: true,
  },
};

export const Small: Story = {
  args: {
    children: "Button",
    size: "small",
  },
};
