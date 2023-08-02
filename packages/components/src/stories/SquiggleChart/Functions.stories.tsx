import type { Meta, StoryObj } from "@storybook/react";

import { SquiggleChart } from "../../components/SquiggleChart.js";
import { sq } from "@quri/squiggle-lang";

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

export const FunctionToNumber: Story = {
  name: "Function to Number",
  args: {
    code: sq`foo(t) = t^2; foo`,
  },
};

export const FunctionToDistribution: Story = {
  name: "Function to Distribution",
  args: {
    code: sq`foo(t) = normal(t,2)*normal(5,3); foo`,
  },
};

export const LogScale: Story = {
  name: "Log scale",
  args: {
    code: sq`
foo(t) = t^2
Plot.numericFn({
  fn: foo,
  xScale: Scale.log({
    min: 1,
    max: 100
  })
})
`,
  },
};

export const WithInfiniteValues: Story = {
  name: "Numeric, With Infinite Values",
  args: {
    code: sq`
    fn(t:[1,100]) = if t < 40 then 1/0 else t
`,
  },
};

// For some reason the first two have different errors
export const WithInfiniteValuesDist: Story = {
  name: "Dist, With Infinite Values",
  args: {
    code: sq`
    fn1(t) = (100 to 200) * (1 / t)
    fn2(t) = (100 to 200) * 1/t
    fn3(t:[1,100]) = if t > 30  then mx(1/0) else normal(t,t)
`,
  },
};

export const CustomTickFormat: Story = {
  name: "Custom tick format",
  args: {
    code: sq`
foo(t) = t^2
Plot.numericFn({
  fn: foo,
  xScale: Scale.linear({ tickFormat: '#x' }),
  yScale: Scale.linear({ tickFormat: '.^10' }),
})`,
  },
};

export const CustomizedFunctionToDistribution: Story = {
  name: "Customized Function to Distribution",
  args: {
    code: sq`
foo(t) = normal(t,2)*normal(5,3)
Plot.distFn({
  fn: foo,
  xScale: Scale.log({ min: 3, max: 100 }),
  distXScale: Scale.linear({ tickFormat: '#x' }),
})
`,
  },
};

export const LogScaleInvalid: Story = {
  name: "Log scale with invalid range",
  args: {
    code: sq`
foo(t) = t^2
Plot.numericFn({
  fn: foo,
  xScale: Scale.log({ min: -1, max: 100 })
})`,
  },
};

export const Unrenderable: Story = {
  args: {
    code: "foo(x, y) = x + y; foo",
  },
};
