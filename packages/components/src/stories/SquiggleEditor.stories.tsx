import type { Meta, StoryObj } from "@storybook/react";

import { SquiggleEditor } from "../components/SquiggleEditor.js";

/**
 * Squiggle Editor is a Squiggle chart with a text editor included for changing the distribution.
 */
const meta = {
  component: SquiggleEditor,
} satisfies Meta<typeof SquiggleEditor>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  name: "Normal",
  args: {
    defaultCode: "normal(5,2)",
  },
};

/**
 * You can name variables like so:
 */
export const Variables: Story = {
  name: "Variables",
  args: {
    defaultCode: "x = 2\nnormal(x,2)",
  },
};
