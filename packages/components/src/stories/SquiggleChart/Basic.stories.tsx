import type { Meta, StoryObj } from "@storybook/react";

import { SqPathItem, SqValuePath } from "@quri/squiggle-lang";

import { SquiggleChart } from "../../components/SquiggleChart.js";

const meta = {
  component: SquiggleChart,
} satisfies Meta<typeof SquiggleChart>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A constant is a simple number as a result. This has special formatting rules to allow large and small numbers being printed cleanly.
 *
 * (See also: NumberShower)
 */
export const Constant: Story = {
  name: "Constant",
  args: {
    code: "500000000",
  },
};

export const Boolean: Story = {
  args: {
    code: "3 == 3",
  },
};

export const String: Story = {
  args: {
    code: '"Lucky day!"',
  },
};

export const WithPathOverride: Story = {
  name: "WithPathOverride",
  args: {
    code: `
    export foo = {bar: {char: {baz: 10}}}
    export bar = {baz: 20}
  `,
    rootPathOverride: new SqValuePath({
      root: "bindings",
      items: [SqPathItem.fromString("foo"), SqPathItem.fromString("bar")],
    }),
  },
};
