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
    f(a, b, c) = [a,b,c]

    a = "A longer description of the calculator goes here...\n"
    
    Calculator.make(
      {
        fn: f,
        title: "My Calculator",
        description: a,
        fields: [
          Input.select({name: "Variable3", default: "alice", options: ["alice", "charles", "bob"]}),
          Input.textArea({name: "Variable2", default: "2 to 40"}),
          Input.text({name: "Variable1", default: 1})
        ],
      }
    )
`,
  },
};
