import type { Meta, StoryObj } from "@storybook/react";

import { SquiggleChart } from "../../components/SquiggleChart.js";

const meta = {
  component: SquiggleChart,
} satisfies Meta<typeof SquiggleChart>;
export default meta;
type Story = StoryObj<typeof meta>;

const code = "mx(5 to 100, uniform(100, 180), 30, 60, 80, [5,5,0.3,0.3,0.3])";
const multiplier = 2;

export const Height7: Story = {
  name: "Height14",
  args: {
    chartHeight: 14 * multiplier,
    code,
  },
};
export const Height15: Story = {
  name: "Height20",
  args: {
    chartHeight: 20 * multiplier,
    code,
  },
};

export const Height40: Story = {
  name: "Height40",
  args: {
    chartHeight: 40 * multiplier,
    code,
  },
};
export const Height40WithLabels: Story = {
  name: "Height 40 with labels",
  args: {
    chartHeight: 40 * multiplier,
    code: `Plot.dist(
      normal(5, 2),
      {
        xScale: Scale.linear({ min: -2, max: 6, title: "X Axis Title" }),
        title: "A Simple Normal Distribution",
        showSummary: true,
      }
    )`,
  },
};

export const Height100: Story = {
  name: "Height 100",
  args: {
    chartHeight: 100 * multiplier,
    code,
  },
};

export const ContinuousSampleSetBig: Story = {
  name: "Height 400",
  args: {
    chartHeight: 400 * multiplier,
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
