import type { Meta, StoryObj } from "@storybook/react";

import { NumberShower } from "../components/NumberShower.js";

/**
 * The number shower is a simple component to display a number.
 * It uses the symbols "K", "M", "B", and "T", to represent thousands, millions, billions, and trillions. Outside of that range, it uses scientific notation.
 */
const meta = {
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

export const InfinityNumber: Story = {
  name: "Infinity",

  args: {
    number: Infinity,
    precision: 2,
  },
};

export const NegativeInfinityNumber: Story = {
  name: "Negative Infinity",

  args: {
    number: -Infinity,
    precision: 2,
  },
};
