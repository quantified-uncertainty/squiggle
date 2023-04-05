import type { Meta, StoryObj } from "@storybook/react";

import { SquigglePlayground as Component } from "../components/SquigglePlayground/index.js";

const meta = {
  title: "Squiggle/SquigglePlayground",
  component: Component,
} satisfies Meta<typeof Component>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  name: "Normal",
  args: {
    code: undefined as any,
    defaultCode: "normal(5,2)",
    height: 800,
  },
};

export const WithShareButton: Story = {
  name: "With share button",
  args: {
    code: undefined as any,
    defaultCode: "normal(5,2)",
    height: undefined,
    showShareButton: true,
  },
};

export const WithoutEditor: Story = {
  name: "Without an editor (e.g. for VS Code environment)",
  args: {
    code: "normal(5,2)",
    height: 800,
    showEditor: false,
  },
};
