import type { Meta, StoryObj } from "@storybook/react";

import { run } from "@quri/squiggle-lang";

import { SquiggleViewer as Component } from "../components/SquiggleViewer/index.js";

/**
 * `<SquiggleViewer>` can display an `SqValue`, that you usually obtain by calling `@quri/squiggle-lang` APIs, e.g. `SqProject.getResult` or `SqProject.getBindings`.
 *
 * If you want to display the output of Squiggle source code, try `<SquiggleChart>`.
 */
const meta: Meta<typeof Component> = { component: Component };
export default meta;
type Story = StoryObj<typeof meta>;

const output = await run("[1, { dist: 2 to 3 }]");

export const Basic: Story = {
  render: () => {
    if (!output.result.ok) {
      throw new Error("Expected an ok result");
    }

    return <Component value={output.result.value.result} />;
  },
};
