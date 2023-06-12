import type { Meta, StoryObj } from "@storybook/react";

import {
  DropdownMenu,
  DropdownMenuActionItem,
  DropdownMenuAsyncActionItem,
} from "../index.js";
import { Button, Dropdown, XIcon } from "../index.js";

const meta = {
  component: Dropdown,
  decorators: [
    (Story: any) => (
      <div className="flex">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Dropdown>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: <Button>Click me</Button>,
    render({ close }) {
      return (
        <DropdownMenu>
          <DropdownMenuActionItem
            title="First item"
            icon={XIcon}
            onClick={() => {}}
          />
          <DropdownMenuActionItem title="Second item" onClick={() => {}} />
          <DropdownMenuAsyncActionItem
            title="Async item"
            icon={XIcon}
            onClick={async () => {
              return new Promise((resolve) => setTimeout(resolve, 1000));
            }}
            close={close}
          />
        </DropdownMenu>
      );
    },
  },
};
