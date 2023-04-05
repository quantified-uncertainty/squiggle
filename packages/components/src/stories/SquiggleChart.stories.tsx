import type { Meta, StoryObj } from "@storybook/react";

import { SquiggleChart } from "../components/SquiggleChart.js";

const meta = {
  title: "Squiggle/SquiggleChart",
  component: SquiggleChart,
} satisfies Meta<typeof SquiggleChart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ContinuousSymbolic: Story = {
  name: "Continuous Symbolic",
  args: {
    code: "normal(5,2)",
  },
};

export const ContinuousPointset: Story = {
  name: "Continuous Pointset",
  args: {
    code: "PointSet.fromDist(normal(5,2))",
  },
};

export const ContinuousSampleSet: Story = {
  name: "Continuous SampleSet",
  args: {
    code: "SampleSet.fromDist(normal(5,2))",
  },
};

export const Discrete: Story = {
  name: "Discrete",
  args: {
    code: "mx(0, 1, 3, 5, 8, 10, [0.1, 0.8, 0.5, 0.3, 0.2, 0.1])",
  },
};

export const DateDistribution: Story = {
  name: "Date Distribution",
  // otherwise SquiggleChart defaults to ".9~s"
  args: {
    code: "mx(1661819770311, 1661829770311, 1661839770311)",
    distributionChartSettings: {
      xAxisType: "dateTime",
      tickFormat: "",
    },
  },
};

export const Mixed: Story = {
  name: "Mixed",
  args: {
    code: "mx(0, 1, 3, 5, 8, normal(8, 1), [0.1, 0.3, 0.4, 0.35, 0.2, 0.8])",
  },
};

export const MultiplePlots: Story = {
  name: "Multiple plots",
  args: {
    code: `
Plot.dists({
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

export const Constant: Story = {
  name: "Constant",
  args: {
    code: "500000000",
  },
};

export const Array: Story = {
  name: "Array",
  args: {
    code: "[normal(5,2), normal(10,1), normal(40,2), 400000]",
  },
};

export const Error: Story = {
  name: "Error",
  args: {
    code: "f(x) = normal(",
  },
};

export const Boolean: Story = {
  name: "Boolean",
  args: {
    code: "3 == 3",
  },
};

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

export const Record: Story = {
  name: "Record",
  args: {
    code: "{foo: 35 to 50, bar: [1,2,3]}",
  },
};

export const String: Story = {
  name: "String",
  args: {
    code: '"Lucky day!"',
  },
};
