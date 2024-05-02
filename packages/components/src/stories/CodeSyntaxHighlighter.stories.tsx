import type { Meta, StoryObj } from "@storybook/react";

import { CodeSyntaxHighlighter } from "../lib/CodeSyntaxHighlighter.js";

/**
 * The number shower is a simple component to display a number.
 * It uses the symbols "K", "M", "B", and "T", to represent thousands, millions, billions, and trillions. Outside of that range, it uses scientific notation.
 */
const meta = {
  component: CodeSyntaxHighlighter,
} satisfies Meta<typeof CodeSyntaxHighlighter>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Squiggle: Story = {
  name: "Squiggle Code",

  args: {
    language: "squiggle",
    children: `/* This is a comment */
const foo = "bar";
normal(5, 1)
normal({ p5: 4, p95: 10 })
normal({ p10: 5, p95: 9 })
normal({ p25: 5, p75: 9 })
normal({ mean: 5, stdev: 2 })
normal(5 to 10, normal(3, 2))
normal({ mean: uniform(5, 9), stdev: 3 })
`,
  },
};

export const JS: Story = {
  name: "Javascript",

  args: {
    language: "javascript",
    children: `const meta = {
        component: CodeSyntaxHighlighter,
      } satisfies Meta<typeof CodeSyntaxHighlighter>;
      export default meta;
      type Story = StoryObj<typeof meta>;
`,
  },
};
