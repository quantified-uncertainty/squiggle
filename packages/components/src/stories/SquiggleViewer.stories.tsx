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

const runResult = await run("[1, { dist: 2 to 3 }]");

if (!runResult.ok) {
  throw new Error("Expected an ok result");
}

const value = { ok: true, value: runResult.value.result } as const;

export const Basic: Story = {
  args: { value },
};
