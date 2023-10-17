import type { Meta, StoryObj } from "@storybook/react";

import { SquiggleChart } from "../../components/SquiggleChart.js";

/**
 * `Plot.scatter` objects in Squiggle are rendered with this chart.
 */
const meta = {
  component: SquiggleChart,
} satisfies Meta<typeof SquiggleChart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    code: `
xDist = 2 to 5
yDist = normal(0, 10) * 5 - xDist ^ 2
Plot.scatter({
  xDist: xDist,
  yDist: yDist
})
`,
  },
};

export const Logarithmic: Story = {
  args: {
    code: `
xDist = 2 to 5
yDist = normal(0, 10) * 5 - xDist ^ 2
Plot.scatter({
  xDist: xDist,
  yDist: yDist,
  xScale: Scale.log(),
})
`,
  },
};

export const DoubleSymlog: Story = {
  args: {
    code: `
xDist = SampleSet.fromDist(1 to 5)
yDist = normal(0, 10) * 5 - xDist
Plot.scatter({
  title: "Double Symlog Scatter Plot",
  xDist: xDist,
  yDist: yDist,
  xScale: Scale.symlog({title: "X Scale"}),
  yScale: Scale.symlog({title: "Y Scale"}),
})
`,
  },
};
