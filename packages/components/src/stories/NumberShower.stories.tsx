import type { Meta, StoryObj } from "@storybook/react";

import { NumberShower } from "../components/NumberShower.js";

const meta = {
  title: "Squiggle/NumberShower",
  component: NumberShower,
} satisfies Meta<typeof NumberShower>;
export default meta;
type Story = StoryObj<typeof meta>;

export const TenThousand: Story = {
  name: "Ten Thousand",

  args: {
    number: 10000,
    precision: 2,
  },
};

export const TenBillion: Story = {
  name: "Ten Billion",

  args: {
    number: 10000000000,
    precision: 2,
  },
};

export const Huge: Story = {
  name: "1.2*10^15",

  args: {
    number: 1200000000000000,
    precision: 2,
  },
};

export const Tiny: Story = {
  name: "1.35*10^-13",

  args: {
    number: 0.000000000000135,
    precision: 2,
  },
};
