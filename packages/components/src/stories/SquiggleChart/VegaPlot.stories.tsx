import type { Meta, StoryObj } from "@storybook/react";

import { SquiggleChart } from "../../components/SquiggleChart.js";

const meta = {
  component: SquiggleChart,
} satisfies Meta<typeof SquiggleChart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    code: `
Plot.vega(
    {
      data: {
        values: [
          { date: "2010-01-01", value: 50 },
          { date: "2010-03-01", value: 33 },
          { date: "2010-05-01", value: 41 },
          { date: "2010-07-01", value: 37 },
          { date: "2010-09-01", value: 29 },
          { date: "2010-11-01", value: 35 },
          { date: "2011-01-01", value: 43 },
          { date: "2011-05-01", value: 56 },
          { date: "2011-07-01", value: 62 },
        ],
      },
      mark: { type: "line", point: true },
      encoding: {
        x: { field: "date", type: "temporal", timeUnit: "year" },
        y: { field: "value", type: "quantitative" },
      },
    }
  )
`,
  },
};
