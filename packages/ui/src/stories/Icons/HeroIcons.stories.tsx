import type { Meta, Story } from "@storybook/react";

import { BarChartIcon, PauseIcon, PlayIcon, CodeBracketIcon, ScaleIcon } from "../../index.js";

export default {
  title: "Icons",
  parameters: {
    component: [BarChartIcon, PauseIcon, PlayIcon, CodeBracketIcon, ScaleIcon]
  }
} as Meta;

const Template: Story = (args) => (
  <>
    <BarChartIcon {...args} />
    <PauseIcon {...args} />
    <PlayIcon {...args} />
    <CodeBracketIcon {...args} />
    <ScaleIcon {...args} />
  </>
);

export const HeroIcons = Template.bind({});
HeroIcons.args = {};