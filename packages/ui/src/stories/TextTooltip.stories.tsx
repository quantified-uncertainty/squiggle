import type { Meta, StoryObj } from "@storybook/react";

import { TextTooltip } from "../components/TextTooltip.js";

const meta = { component: TextTooltip } satisfies Meta<typeof TextTooltip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: <div className="flex border p-1 w-24">Hover me</div>,
    text: "Tooltip text",
    placement: "top",
  },
};
