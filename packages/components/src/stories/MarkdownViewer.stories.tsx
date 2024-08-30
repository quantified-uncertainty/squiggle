import type { Meta, StoryObj } from "@storybook/react";

import { MarkdownViewer } from "../lib/MarkdownViewer.js";

const meta = {
  component: MarkdownViewer,
} satisfies Meta<typeof MarkdownViewer>;
export default meta;
type Story = StoryObj<typeof meta>;

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

<squiggleplayground>
pianoTunersPerPiano = {
  pianosPerPianoTuner = 2k to 50k
  1 / pianosPerPianoTuner
}
</squiggleplayground>

In-between text

<squiggleeditor>
foo = 23 to 50
</squiggleeditor>

---

<squiggleplayground>
// details of this playground
pianoTunersPerPiano = {
  pianosPerPianoTuner = 2k to 50k
  1 / pianosPerPianoTuner
}
</squiggleplayground>

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

export const Details: Story = {
  name: "Details Dropdown",

  args: {
    textSize: "sm",
    md: `
# Quick React FAQ

<details>
  <summary>Squiggle Editor</summary>

<squiggleeditor>
foo = 23 to 50
</squiggleeditor>

</details>

<details>
  <summary>Squiggle Playground</summary>

  <squiggleplayground>
// details of this playground
pianoTunersPerPiano = {
  pianosPerPianoTuner = 2k to 50k
  1 / pianosPerPianoTuner
}
</squiggleplayground>
</details>

<details>
  <summary>What are React Hooks?</summary>

  Hooks are functions that let you use state and other React features in functional components. Common hooks include useState and useEffect.
</details>

<details>
  <summary>Can you show a simple React component?</summary>

  Here's a basic counter component:
  \`\`\`jsx
  import React, { useState } from 'react';

  function Counter() {
    const [count, setCount] = useState(0);
    return (
      <div>
        <p>Count: {count}</p>
        <button onClick={() => setCount(count + 1)}>Increment</button>
      </div>
    );
  }
  \`\`\`
</details>
`,
  },
};

export const NestedCodeBlocks: Story = {
  name: "Nested Code Blocks",

  args: {
    textSize: "sm",
    md:
      "````javascript\n" +
      "```\n" +
      "Here's a concise, one-line Squiggle model as requested:\n" +
      "\n" +
      "<squiggleplayground>\n" +
      "a = mx(normal(5,2), uniform(0,10), lognormal({p5: 1, p95: 20}))\n" +
      "a\n" +
      "</squiggleplayground>\n" +
      "\n" +
      "This single line creates a mixture distribution of three different probability distributions: a normal distribution, a uniform distribution, and a lognormal distribution. It's a simple yet potentially useful model for various scenarios where you might need to combine different types of uncertainty.\n" +
      "```\n" +
      "````",
  },
};
