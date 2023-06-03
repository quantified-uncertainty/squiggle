import type { Meta, StoryObj } from "@storybook/react";

import { XIcon } from "../../index.js";

const meta = { component: XIcon } satisfies Meta<typeof XIcon>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
