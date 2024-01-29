import type { Meta, StoryObj } from "@storybook/react";

import { run } from "@quri/squiggle-lang";

import { SquiggleErrorAlert as Component } from "../components/ui/SquiggleErrorAlert.js";

/**
 * `<SquiggleErrorAlert>` displays an `SqError` value.
 */
const meta = {
  component: Component,
} satisfies Meta<typeof Component>;
export default meta;
type Story = StoryObj<typeof meta>;

async function getErrorFromCode(code: string) {
  const result = await run(code);
  if (result.ok) {
    throw new Error("Expected an error");
  }
  return result.value;
}

export const CompileError: Story = {
  args: { error: await getErrorFromCode("2+") },
};

export const RuntimeError: Story = {
  args: { error: await getErrorFromCode('2+"foo"') },
};
