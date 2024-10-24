import type { Meta, StoryObj } from "@storybook/react";

import { CodeSyntaxHighlighter } from "../lib/CodeSyntaxHighlighter.js";

/**
 * Highlighting for Squiggle or Javascript code, implemented using [Shiki](https://shiki.matsu.io/).
 *
 * See also: `<MarkdownViewer>`, which relies on this component for code blocks.
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
foo = "bar"
d1 = normal(5, 1)
d2 = normal({ p5: 4, p95: 10 })
d3 = normal({ p10: 5, p95: 9 })
d4 = normal({ p25: 5, p75: 9 })
d5 = normal({ mean: 5, stdev: 2 })
d6 = normal(5 to 10, normal(3, 2))
d7 = normal({ mean: uniform(5, 9), stdev: 3 })
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
