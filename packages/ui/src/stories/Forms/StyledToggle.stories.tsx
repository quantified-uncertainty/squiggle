import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import {
  StyledToggle,
  StyledToggleProps,
} from "../../forms/styled/StyledToggle.js";

const meta = { component: StyledToggle } satisfies Meta<typeof StyledToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

const renderToggle = (args: StyledToggleProps) => {
  const [checked, setChecked] = useState(false);
  return <StyledToggle {...args} checked={checked} onChange={setChecked} />;
};

export const Default: Story = {
  args: {
    checked: false,
    onChange: (newValue: boolean) => {
      console.log("Toggle value changed to:", newValue);
    },
  },

  render: (args) => renderToggle(args),
};

export const WithoutFocusRing: Story = {
  args: {
    checked: false,
    showFocusRing: false,
    onChange: (newValue: boolean) => {
      console.log("Toggle value changed to:", newValue);
    },
  },
  render: (args) => renderToggle(args),
};

export const Tiny: Story = {
  args: {
    checked: false,
    size: "tiny",
    onChange: (newValue: boolean) => {
      console.log("Toggle value changed to:", newValue);
    },
  },
  render: (args) => renderToggle(args),
};
