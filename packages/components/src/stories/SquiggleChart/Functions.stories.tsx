import type { Meta, StoryObj } from "@storybook/react";

import { SquiggleChart } from "../../components/SquiggleChart.js";

/**
 * There are two types of functions that we can render:
 * 1. number => number
 * 2. number => dist
 */
const meta = {
  component: SquiggleChart,
} satisfies Meta<typeof SquiggleChart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const FunctionToDistribution: Story = {
  name: "Function to Distribution",
  args: {
    code: "foo(t) = normal(t,2)*normal(5,3); foo",
  },
};

export const FunctionToNumber: Story = {
  name: "Function to Number",
  args: {
    code: "foo(t) = t^2; foo",
  },
};

export const LogScale: Story = {
  name: "Log scale",
  args: {
    code: "foo(t) = t^2; Plot.fn({ fn: foo, xScale: Scale.log({ min: 1, max: 100 }) })",
  },
};

export const LogScaleInvalid: Story = {
  name: "Log scale with invalid range",
  args: {
    code: "foo(t) = t^2; Plot.fn({ fn: foo, xScale: Scale.log({ min: -1, max: 100 }) })",
  },
};

export const Unrenderable: Story = {
  args: {
    code: "foo(x, y) = x + y; foo",
  },
};
