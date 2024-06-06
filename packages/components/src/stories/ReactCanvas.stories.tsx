import type { Meta, StoryObj } from "@storybook/react";

import { CanvasExample } from "../lib/draw/ReactCanvas.js";

/**
 * The number shower is a simple component to display a number.
 * It uses the symbols "K", "M", "B", and "T", to represent thousands, millions, billions, and trillions. Outside of that range, it uses scientific notation.
 */
const meta = {
  component: CanvasExample,
} satisfies Meta<typeof CanvasExample>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Main: Story = {};
