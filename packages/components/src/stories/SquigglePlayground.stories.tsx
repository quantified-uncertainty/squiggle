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
    defaultCode: "normal(5,2)",
    height: 800,
  },
};

export const Slow: Story = {
  name: "Slow Code",
  args: {
    defaultCode: "List.upTo(1,5000000) -> reduce(0,add)",
    height: 800,
  },
};

export const WithNestedResult: Story = {
  name: "Nested  Code",
  args: {
    defaultCode: `a = normal(5,2)
e = [1,2,3,4,5,6,7,8,9,10,11]
b = a + 4
c = a + 2
d = {e: {f: {g1: a, g2: b, g3: {h: {i: a}}}}}
    `,
    height: 800,
  },
};

export const RelativeValues: Story = {
  name: "RelativeValues plot",
  args: {
    code: undefined as any,
    defaultCode: `ids = ["foo", "bar"]
foo = SampleSet.fromDist(2 to 5)
bar = foo + SampleSet.fromDist(3 to 6) * 0.5
items = {
  foo: foo,
  bar: bar
}
fn = { |id1, id2|
  [items[id1], items[id2]]
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
