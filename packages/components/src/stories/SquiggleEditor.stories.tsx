import type { Meta, StoryObj } from "@storybook/react";

import { SquiggleEditor } from "../components/SquiggleEditor.js";

const meta = {
  title: "Squiggle/SquiggleEditor",
  component: SquiggleEditor,
} satisfies Meta<typeof SquiggleEditor>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  name: "Normal",
  args: {
    code: undefined as any,
    defaultCode: "normal(5,2)",
  },
};

export const Controlled: Story = {
  name: "Controlled",
  args: {
    code: "normal(5,2)",
  },
};

export const Variables: Story = {
  name: "Variables",
  args: {
    code: undefined as any,
    defaultCode: "x = 2\nnormal(x,2)",
  },
};
