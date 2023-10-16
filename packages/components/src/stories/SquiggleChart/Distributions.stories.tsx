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

export const ContinuousSymbolic: Story = {
  name: "Continuous Symbolic",
  args: {
    code: "Sym.normal(5,2)",
  },
};

export const ContinuousPointset: Story = {
  name: "Continuous Pointset",
  args: {
    code: "PointSet.fromDist(normal(5,2))",
  },
};

export const NonnormalizedContinousPointSet: Story = {
  name: "Non-normalized Continuous Pointset",
  args: {
    code: "normal(5,2) .- uniform(3,8)",
  },
};

export const ContinuousSampleSet: Story = {
  name: "Continuous SampleSet",
  args: {
    code: "SampleSet.fromDist(normal(5,2))",
  },
};

export const ContinuousSampleSet1MSamples: Story = {
  name: "Continuous SampleSet, 1M Sample",
  args: {
    code: "SampleSet.fromDist(uniform(5,10))",
    environment: {
      sampleCount: 1000000,
      xyPointLength: 1000,
    },
  },
};

export const Discrete: Story = {
  args: {
    code: "mx([0, 1, 3, 5, 8, 10], [0.1, 0.8, 0.5, 0.3, 0.2, 0.1])",
  },
};

export const Scales: Story = {
  name: "Continuous with scales",
  args: {
    code: `Plot.dist({
  dist: 1 to 5,
  xScale: Scale.symlog(),
  yScale: Scale.power({ exponent: 0.1 }),
})`,
  },
};

export const SymbolicWithXLabel: Story = {
  name: "Symbolic with x label",
  args: {
    code: `Plot.dist({
  dist: Sym.normal(5,2),
  xScale: Scale.linear({title: "X Scale"}),
  yScale: Scale.linear(),
})`,
  },
};

export const CustomTickFormat: Story = {
  name: "Custom tick format",
  args: {
    code: `Plot.dist({
  dist: beta(3, 5),
  title: "Beta(3, 5)",
  xScale: Scale.linear({ tickFormat: ".0%" , title: "X Scale"}),
})`,
  },
};

export const Mixed: Story = {
  name: "Mixed",
  args: {
    code: "mx([0, 1, 3, 5, 8, normal(8, 1)], [0.1, 0.3, 0.4, 0.35, 0.2, 0.8])",
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
