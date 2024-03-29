import type { Meta, StoryObj } from "@storybook/react";

import { MarkdownViewer } from "../lib/MarkdownViewer.js";

/**
 * The number shower is a simple component to display a number.
 * It uses the symbols "K", "M", "B", and "T", to represent thousands, millions, billions, and trillions. Outside of that range, it uses scientific notation.
 */
const meta = {
  component: MarkdownViewer,
} satisfies Meta<typeof MarkdownViewer>;
export default meta;
type Story = StoryObj<typeof meta>;

//This is a long example, generated by GPT-4.
export const Default: Story = {
  name: "Default",

  args: {
    textSize: "sm",
    md: `
# Markdown Example

This is a *Markdown* example. Markdown allows you to write using an easy-to-read, easy-to-write plain text format, which then converts to structurally valid HTML.

## Why Markdown?
1. **Simplicity**: It's easy to read and write.
2. **Flexibility**: Suitable for many types of documentation.
3. **Compatibility**: Works on any platform.

### Code Blocks
Inline \`code\` has \`back-ticks\` around it.

Block code "fences":

\`\`\`
Sample text here...
\`\`\`

Syntax highlighting:

\`\`\`javascript
function helloWorld() {
  console.log("Hello, world!");
}
\`\`\`

\`\`\`squiggle
pianoTunersPerPiano = {
  pianosPerPianoTuner = 2k to 50k
  1 / pianosPerPianoTuner
}
\`\`\`

### Blockquotes

> Markdown is a lightweight markup language with plain-text formatting syntax.
> Its design allows it to be converted to many output formats.

### Tables

| Syntax    | Description |
| --------- | ----------- |
| Header    | Title       |
| Paragraph | Text        |

### Hyperlinks

[Markdown Guide](https://www.markdownguide.org)

### Images

![Markdown Logo](https://markdown-here.com/img/icon256.png)

`,
  },
};

export const Custom: Story = {
  name: "Custom",

  args: {
    textSize: "sm",
    md: `
Overrides the default display type for a value. Different value types can be displayed in different ways. Distributions can be displayed using distribution plots. Arrays can be displayed using tables. Certain single-parameter functions can be displayed \`Plot.numericFn()\` or \`Plot.distFn()\`. All functions can be displayed using calculators.

\`showAs()\` can take either a visualization, or a function that calls the value and returns a visualization. You can use it like,
\`\`\`js
{|x| x + 1} -> Tag.showAs(Calculator)
\`\`\`

\`\`\`js
const foo = "bar";
normal(5, 1)
normal({ p5: 4, p95: 10 })
normal({ p10: 5, p95: 9 })
normal({ p25: 5, p75: 9 })
normal({ mean: 5, stdev: 2 })
normal(5 to 10, normal(3, 2))
normal({ mean: uniform(5, 9), stdev: 3 })
\`\`\`
`,
  },
};
