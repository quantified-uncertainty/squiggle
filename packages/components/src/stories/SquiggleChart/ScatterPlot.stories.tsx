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
xDist = SampleSet.fromDist(2 to 5)
yDist = (-3 to 3) * 5 - xDist ^ 2
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
xDist = SampleSet.fromDist(2 to 5)
yDist = (-3 to 3) * 5 - xDist ^ 2
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
xDist = SampleSet.fromDist(-2 to 5)
yDist = (-3 to 3) * 5 - xDist
Plot.scatter({
  xDist: xDist,
  yDist: yDist,
  xScale: Scale.symlog(),
  yScale: Scale.symlog(),
})
`,
  },
};
