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
    Calculator.make(
      {
        fn: {|a,b,c|a+b+c},
        rows: ["a", "b", "c"]
      }
    )
`,
  },
};
