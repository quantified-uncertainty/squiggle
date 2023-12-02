import type { Meta, StoryObj } from "@storybook/react";

import { ModuleDocumentation } from "../components/ui/ModuleDocumentation.js";

/**
 * Internal UI component. Used in `SquigglePlayground`.
 */
const meta = { component: ModuleDocumentation } satisfies Meta<
  typeof ModuleDocumentation
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  name: "Primary",
  args: {
    moduleName: "math",
  },
};
