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
    f(a, b, c) = [a + b, a, c]

    a = "\n## My favorite calculator\nA longer description of the calculator goes here...\n"
    
    Calculator.make(
      {
        fn: f,
        description: a,
        fields: [
          {
            name: "Variable 1",
            default: "1",
            description: "This is a short description of the first variable input",
          },
          { name: "Variable2", default: "2 to 40" },
          { name: "Some array", default: "[3,3,5,2,2]" },
        ],
      }
    )
`,
  },
};
