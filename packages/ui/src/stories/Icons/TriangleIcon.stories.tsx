import type { Meta, StoryObj } from "@storybook/react";

import { TriangleIcon } from "../../index.js";

const meta = { component: TriangleIcon } satisfies Meta<typeof TriangleIcon>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
