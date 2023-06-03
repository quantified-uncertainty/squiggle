import type { Meta, StoryObj } from "@storybook/react";

import { TrashIcon } from "../../index.js";

const meta = { component: TrashIcon } satisfies Meta<typeof TrashIcon>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
