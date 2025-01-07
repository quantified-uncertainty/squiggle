import type { Meta, StoryObj } from "@storybook/react";

import { SquiggleEditor } from "../components/SquiggleEditor.js";

/**
 * Squiggle Editor is a Squiggle chart with a text editor included for changing the distribution.
 */
const meta = {
  component: SquiggleEditor,
} satisfies Meta<typeof SquiggleEditor>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default editor.
 *
 * Default behavior is the auto-resizeable according to the code height, without a scrollbar.
 */
export const Normal: Story = {
  name: "Normal",
  args: {
    defaultCode: "normal(5,2)",
  },
};

/**
 * You can name variables like so:
 */
export const Variables: Story = {
  name: "Variables",
  args: {
    defaultCode: "x = 2\nnormal(x,2)",
  },
};

/**
 * If height if set, the editor will always be scrollable, with Codemirror's [scrollPastEnd](https://codemirror.net/docs/ref/#view.scrollPastEnd) extension.
 */
export const FixedHeight: Story = {
  args: {
    defaultCode: "x = 2\nd1 = normal(x,2)\nd2 = normal(x,2)",
    editorHeight: 100,
  },
};
