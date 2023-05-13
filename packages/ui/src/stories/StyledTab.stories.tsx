import type { Meta, StoryObj } from "@storybook/react";

import { StyledTab } from "../components/StyledTab.js";

const Icon = () => <div />;

/**
 * StyledTab component wraps the [\<Tab\>](https://headlessui.com/react/tabs) component from Headless UI.
 */
const meta = {
  // https://github.com/tailwindlabs/headlessui/issues/2306 causes problems with Typescript
  component: StyledTab as any,
} satisfies Meta<typeof StyledTab>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <StyledTab.Group>
      <StyledTab.List>
        <StyledTab name="Code" icon={Icon} />
        <StyledTab name="Settings" icon={Icon} />
      </StyledTab.List>
      <div className="mt-2 border border-slate-200 p-2">
        <StyledTab.Panels>
          <StyledTab.Panel>Code panel</StyledTab.Panel>
          <StyledTab.Panel>Settings panel</StyledTab.Panel>
        </StyledTab.Panels>
      </div>
    </StyledTab.Group>
  ),
};

// TODO - story for icon attribute
