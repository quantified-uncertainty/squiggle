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
    validate(fn) = {
        errors = List.upTo(2020, 2030)
          -> List.map(
            {|e| [Date(e), typeOf(fn(Date(e))) == "Distribution"]}
          )
          -> List.filter(
            {|e| true}
          )
        "Has errors!"
      }
      
      Spec.make(
        {
          name: "Stock market over time",
          documentation: "The S&P500 stock market price, over time.",
          validate: validate,
          showAs: {|e| e(Date(2024))},
        }
      )
`,
  },
};
