import type { Meta, StoryObj } from "@storybook/react";

import { SquigglePlayground as Component } from "../components/SquigglePlayground/index.js";

/**
 * A Squiggle playground is an environment where you can play around with all settings, including sampling settings, in Squiggle.
 */
const meta = {
  component: Component,
} satisfies Meta<typeof Component>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  name: "Normal",
  args: {
    code: undefined as any, // this is a Typescript bug in SquigglePlayground props signature
    defaultCode: "normal(5,2)",
    height: 800,
  },
};

export const RelativeValues: Story = {
  name: "RelativeValues plot",
  args: {
    code: undefined as any,
    defaultCode: `ids = ["foo", "bar"]
fn = {
  |id1, id2|
  [SampleSet.fromDist(2 to 5), SampleSet.fromDist(3 to 6)]
}

RelativeValues.gridPlot({
  ids: ids,
  fn: fn
})
`,
  },
};

export const WithShareButton: Story = {
  name: "With share button",
  args: {
    code: undefined as any,
    defaultCode: "normal(5,2)",
    height: undefined,
    showShareButton: true,
  },
};

export const WithoutEditor: Story = {
  name: "Without an editor (e.g. for VS Code environment)",
  args: {
    code: "normal(5,2)",
    height: 800,
    showEditor: false,
  },
};
