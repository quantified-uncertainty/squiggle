import type { Meta, StoryObj } from "@storybook/react";

import { TextTooltip } from "../components/TextTooltip.js";

const meta = { component: TextTooltip } satisfies Meta<typeof TextTooltip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: <div className="flex border p-1 w-24">Hover me</div>,
    text: "Tooltip text",
    placement: "top",
  },
};

export const Long: Story = {
  args: {
    children: <div className="flex border p-1 w-24">Hover me</div>,
    text: "Prow scuttle parrel provost Sail ho shrouds spirits boom mizzenmast yardarm. Pinnace holystone mizzenmast quarter crow's nest nipperkin grog yardarm hempen halter furl. Swab barque interloper chantey doubloon starboard grog black jack gangway rutters.",
    placement: "top",
  },
};
