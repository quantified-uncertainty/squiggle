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
    f(a, b, c, d) = [a,b,c,d]

    a = "A longer description of the calculator goes here...\n"
    
    Calculator.make(
      {
        fn: f,
        title: "My Calculator",
        description: a,
        inputs: [
          Input.checkbox({name: "VariableCheckbox", description: "This is a long name", default: false}),
          Input.textArea({name: "Variable2", description: "This is a long name", default: "2 to 40"}),
          Input.text({name: "Variable1", description: "This is a very long description This is a very long description This is a very long description This is a very long description This is a very long description", default: 1}),
          Input.select({name: "Variable3", default: "alice", options: ["alice", "charles", "bob", "bill", "maven", "billy", "samantha", "becky"]})
        ],
      }
    )
`,
  },
};
