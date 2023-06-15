import type { Meta, StoryObj } from "@storybook/react";

import { RadioFormField } from "../../index.js";
import { formDecorator } from "./withRHF.js";

const meta = {
  component: RadioFormField,
  decorators: [formDecorator],
} satisfies Meta<typeof RadioFormField>;
export default meta;
type Story = StoryObj<typeof RadioFormField>;

export const Default: Story = {
  args: {
    name: "fieldName",
    label: "Radio label",
    options: [
      {
        id: "first",
        name: "First option",
      },
      {
        id: "second",
        name: "Second option",
      },
      {
        id: "disabled",
        name: "Disabled option",
        disabled: true,
        tooltip: "This text shows on hover",
      },
    ],
  },
};
