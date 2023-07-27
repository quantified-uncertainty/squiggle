import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "@quri/ui";

import { PanelWithToolbar } from "../components/ui/PanelWithToolbar/index.js";
import { ToolbarItem } from "../components/ui/PanelWithToolbar/ToolbarItem.js";

/**
 * Internal UI component. Used in `SquigglePlayground`.
 */
const meta = { component: PanelWithToolbar } satisfies Meta<
  typeof PanelWithToolbar
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    renderToolbar: ({ openModal }) => (
      <div className="flex items-center gap-2">
        <ToolbarItem>Item</ToolbarItem>
        <Button size="small" onClick={() => openModal("m1")}>
          modal 1
        </Button>
        <Button size="small" onClick={() => openModal("m2")}>
          modal 2
        </Button>
      </div>
    ),
    renderBody: () => <div>body</div>,
    renderModal: (name) =>
      name === "m1"
        ? { title: "Modal 1", body: <div>Modal 1 content</div> }
        : { title: "Modal 2", body: <div>Modal 2 content</div> },
  },
};
