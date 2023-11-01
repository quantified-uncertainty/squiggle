import type { Meta, StoryObj } from "@storybook/react";
import { StyledTextArea } from "../../index.js";

const meta = { component: StyledTextArea } satisfies Meta<
  typeof StyledTextArea
>;
export default meta;
type Story = StoryObj<typeof StyledTextArea>;

export const Default: Story = {
  args: {
    name: "fieldName",
  },
};

export const WithPlaceholder: Story = {
  args: {
    name: "fieldName",
    placeholder: "Placeholder...",
  },
};

export const Disabled: Story = {
  args: {
    name: "fieldName",
    disabled: true,
  },
};

export const WithOnChange: Story = {
  args: {
    name: "fieldName",
    onChange: (e) => {
      // eslint-disable-next-line no-console
      console.log(e.target.value);
    },
  },
};
