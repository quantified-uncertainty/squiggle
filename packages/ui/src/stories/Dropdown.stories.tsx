import type { Meta, StoryObj } from "@storybook/react";

import { ComponentType } from "react";
import {
  Button,
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
  DropdownMenuAsyncActionItem,
  DropdownMenuHeader,
  DropdownMenuSeparator,
  RefreshIcon,
  TrashIcon,
} from "../index.js";

const meta = {
  component: Dropdown,
  decorators: [
    (Story: ComponentType) => (
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
          <DropdownMenuHeader>Header</DropdownMenuHeader>
          <DropdownMenuActionItem
            title="Refresh"
            icon={RefreshIcon}
            onClick={() => undefined}
          />
          <DropdownMenuActionItem title="Edit" onClick={() => undefined} />
          <DropdownMenuSeparator />
          <DropdownMenuAsyncActionItem
            title="Delete (async)"
            icon={TrashIcon}
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
