import type { Meta, StoryObj } from "@storybook/react";

import { DotsHorizontalIcon } from "../../index.js";

const meta = { component: DotsHorizontalIcon } satisfies Meta<
  typeof DotsHorizontalIcon
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
