import type { Meta, StoryObj } from "@storybook/react";

import { RefreshIcon } from "../../index.js";

const meta = { component: RefreshIcon } satisfies Meta<typeof RefreshIcon>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Spinning: Story = {
  args: {
    className: "animate-spin",
  },
};
