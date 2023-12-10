import type { Meta, StoryObj } from "@storybook/react";
import { FC } from "react";

import { Button, useToast, WithToasts } from "../index.js";

const meta = {
  component: WithToasts,
} satisfies Meta<typeof WithToasts>;
export default meta;
type Story = StoryObj<typeof meta>;

const Controls: FC = () => {
  const toast = useToast();
  return (
    <div className="h-40 space-y-2">
      <Button onClick={() => toast("This is an error", "error")}>
        Send error
      </Button>
      <Button onClick={() => toast("This is a confirmation", "confirmation")}>
        Send confirmation
      </Button>
    </div>
  );
};

export const Default: Story = {
  args: {
    children: <Controls />,
  },
};
