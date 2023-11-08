import type { Meta, StoryObj } from "@storybook/react";

import { ButtonWithDropdown } from "../components/ButtonWithDropdown.js";
import { DropdownMenu, DropdownMenuActionItem } from "../index.js";

const meta = { component: ButtonWithDropdown } satisfies Meta<
  typeof ButtonWithDropdown
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Button With Dropdown",
    onClick: () => window.alert("button clicked"),
    renderDropdown: ({ close }) => (
      <DropdownMenu>
        <DropdownMenuActionItem title="Example item" onClick={() => close()} />
      </DropdownMenu>
    ),
  },
};

export const Primary: Story = {
  args: {
    children: "Button With Dropdown",
    theme: "primary",
    onClick: () => window.alert("button clicked"),
    renderDropdown: ({ close }) => (
      <DropdownMenu>
        <DropdownMenuActionItem title="Example item" onClick={() => close()} />
      </DropdownMenu>
    ),
  },
};

export const Small: Story = {
  args: {
    children: "Button With Dropdown",
    size: "small",
    onClick: () => window.alert("button clicked"),
    renderDropdown: ({ close }) => (
      <DropdownMenu>
        <DropdownMenuActionItem title="Example item" onClick={() => close()} />
      </DropdownMenu>
    ),
  },
};
