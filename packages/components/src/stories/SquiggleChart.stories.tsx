import type { Meta, StoryObj } from "@storybook/react";

import { SqValuePath } from "@quri/squiggle-lang";

import { SquiggleChart } from "../components/SquiggleChart.js";

/**
 * Squiggle chart evaluates Squiggle code, and then displays the output.
 *
 * By default, it will give access to both "Variables" and "Result", but this can be controlled with `rootPathOverride` parameter. Using it will limit the output to a single value.
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

export const RootPathOverride: Story = {
  args: {
    code: "{foo: 35 to 50, bar: [1,2,3]}",
    rootPathOverride: new SqValuePath({
      root: "result",
      items: [{ type: "string", value: "bar" }],
    }),
  },
};
