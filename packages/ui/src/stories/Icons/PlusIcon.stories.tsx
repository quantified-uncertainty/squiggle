import type { Meta, StoryObj } from "@storybook/react";

import { PlusIcon } from "../../index.js";

const meta = { component: PlusIcon } satisfies Meta<typeof PlusIcon>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
