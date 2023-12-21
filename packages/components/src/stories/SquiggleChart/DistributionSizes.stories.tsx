import type { Meta, StoryObj } from "@storybook/react";

import { SquiggleChart } from "../../components/SquiggleChart.js";

/**
 * A distribution means that the result forms a probability distribution. This
 * could be continuous, discrete or mixed.
 */
const meta = {
  component: SquiggleChart,
} satisfies Meta<typeof SquiggleChart>;
export default meta;
type Story = StoryObj<typeof meta>;

const code = "5 to 100";
export const Height15: Story = {
  name: "Height15",
  args: {
    chartHeight: 15,
    code,
  },
};

export const Height40: Story = {
  name: "Height40",
  args: {
    chartHeight: 40,
    code,
  },
};

export const Height100: Story = {
  name: "Height 100",
  args: {
    code,
  },
};

export const ContinuousSampleSetBig: Story = {
  name: "Height 400",
  args: {
    chartHeight: 400,
    code,
  },
};

export const MultiplePlots: Story = {
  name: "Multiple plots",
  args: {
    code: `
Plot.dists({
  title: "Multiple plots",
  xScale: Scale.linear({ title: "X Scale" }),
dists: [
{
 name: "one",
 value: mx(0.5, normal(0,1))
},
{
 name: "two",
 value: mx(2, normal(5, 2)),
}
]
})
`,
  },
};
