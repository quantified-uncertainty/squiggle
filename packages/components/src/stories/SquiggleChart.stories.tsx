import type { Meta, StoryObj } from "@storybook/react";

import { SquiggleChart } from "../components/SquiggleChart.js";

/**
 * Squiggle chart evaluates squiggle expressions, and then displays the resulting squiggle value.
 *
 * A squiggle value can be a nested tree of arrays and dicts. Possible leaf types are a distribution, a constant, and a function.
 */
const meta = {
  component: SquiggleChart,
} satisfies Meta<typeof SquiggleChart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Nested: Story = {
  args: {
    code: `{
  square: {|x|x*x},
  dists: [
    normal(5,2),
    mx(5, 2 to 5)
  ]
}`,
  },
};

export const WithHeader: Story = {
  args: {
    ...Nested.args,
    showHeader: true,
  },
};

export const Array: Story = {
  args: {
    code: "[normal(5,2), normal(10,1), normal(40,2), 400000]",
  },
};

export const Error: Story = {
  args: {
    code: "f(x) = normal(",
  },
};

export const Dict: Story = {
  args: {
    code: "{foo: 35 to 50, bar: [1,2,3]}",
  },
};
