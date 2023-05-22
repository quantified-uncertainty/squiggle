import type { Meta, StoryObj } from "@storybook/react";

import { SquigglePlayground as Component } from "../components/SquigglePlayground/index.js";

/**
 * A Squiggle playground is an environment where you can play around with all settings, including sampling settings, in Squiggle.
 */
const meta = {
  component: Component,
} satisfies Meta<typeof Component>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  name: "Normal",
  args: {
    defaultCode: "normal(5,2)",
    height: 800,
  },
};

export const WithShareButton: Story = {
  name: "With share button",
  args: {
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
