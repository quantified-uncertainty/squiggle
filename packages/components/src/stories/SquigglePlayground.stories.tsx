import type { Meta, StoryObj } from "@storybook/react";

import { SquigglePlayground as Component } from "../components/SquigglePlayground/index.js";
import { Button } from "@quri/ui";

/**
 * A Squiggle playground is an environment where you can play around with all settings, including sampling settings, in Squiggle.
 */
const meta: Meta<typeof Component> = {
  component: Component,
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  name: "Normal",
  args: {
    defaultCode: "normal(5,2)",
    height: 800,
  },
};

export const HeightAndScroll: Story = {
  name: "Custom height and scrollbars",
  args: {
    defaultCode:
      "List.upTo(1,10) -> map({|i| i to i + 1})" + new Array(100).join("\n"),
    height: 400,
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

export const WithExtraControls: Story = {
  name: "With extra controls",
  args: {
    defaultCode: "normal(5,2)",
    height: undefined,
    renderExtraControls: ({ openModal }) => (
      <div className="ml-2 h-full flex items-center">
        <Button size="small" onClick={() => openModal("extra")}>
          Extra modal
        </Button>
      </div>
    ),
    renderExtraModal: (name) =>
      name === "extra"
        ? {
            title: "Extra",
            body: <div>Extra content</div>,
          }
        : undefined,
  },
};
