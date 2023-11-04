import type { Meta, StoryObj } from "@storybook/react";

import { TextFormField } from "../../index.js";
import { formDecorator } from "./withRHF.js";

const meta = {
  component: TextFormField,
  decorators: [formDecorator],
} satisfies Meta<typeof TextFormField>;
export default meta;
type Story = StoryObj<typeof TextFormField>;

export const Default: Story = {
  args: {
    name: "slug",
    label: "Slug",
    description: "Alphanumerical slug (examples: foo-bar, foo_bar, foo123).",
    placeholder: "my-slug",
  },
};

export const Small: Story = {
  args: {
    name: "small",
    label: "Small",
    description: "size=small",
    placeholder: "Placeholder",
    size: "small",
  },
};

export const WithValidation: Story = {
  args: {
    ...Default.args,
    rules: {
      pattern: {
        value: /^[\w-]+$/,
        message: "Must be alphanumerical",
      },
      required: {
        value: true,
        message: "Must be non-empty",
      },
    },
  },
};
