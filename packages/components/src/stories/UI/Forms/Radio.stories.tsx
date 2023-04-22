import type { Meta, StoryObj } from "@storybook/react";

import { Radio } from "../../../components/ui/Radio.js";
import { withRHF } from "./withRHF.js";
import React from "react";

const meta = {
  component: Radio,
} satisfies Meta<typeof Radio>;
export default meta;
type Story = StoryObj<typeof Radio>;

export const Default: Story = {
  render: withRHF((args, register) => <Radio {...args} register={register} />),
  args: {
    name: "fieldName",
    label: "Radio label",
    initialId: "first",
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
