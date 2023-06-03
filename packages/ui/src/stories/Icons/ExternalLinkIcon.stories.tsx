import type { Meta, StoryObj } from "@storybook/react";

import { ExternalLinkIcon } from "../../index.js";

const meta = { component: ExternalLinkIcon } satisfies Meta<
  typeof ExternalLinkIcon
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
