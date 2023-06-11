import type { Meta, StoryObj } from "@storybook/react";

import { TextAreaFormField } from "../../index.js";
import { formDecorator } from "./withRHF.js";

const meta = {
  component: TextAreaFormField,
  decorators: [formDecorator],
} satisfies Meta<typeof TextAreaFormField>;
export default meta;
type Story = StoryObj<typeof TextAreaFormField>;

export const Default: Story = {
  args: {
    name: "slug",
    label: "Long text",
    description: "Textareas are autosized.",
    placeholder: "Enter long text here",
  },
};
