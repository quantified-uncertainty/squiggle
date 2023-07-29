import type { Meta, StoryObj } from "@storybook/react";

import { SquigglePlayground as Component } from "../components/SquigglePlayground/index.js";
import { Button } from "@quri/ui";
import { sq } from "@quri/squiggle-lang";

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
nested = {e: {f: {g1: a, g2: b, g3: {h: {i: a}}}}}
e = 6
t = 7
y = 7
u = 1
g = 1
e = 3
q = 5
w = 2
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

export const Comments: Story = {
  name: "With comments",
  args: {
    defaultCode: sq`/** This comment will be attached to x */
show1 = true

// Line comments won't work.
noShow1 = false

/* Block comments starting with a single star won't work either; we follow JSDoc conventions in this. */
noShow2 = false

/*** Triple stars are forbidden too; again, JSDoc convention. */
noShow2 = false

/** This comment won't show because \`show2\` is shadowed */
show2 = false

/** If variable is redefined, we attach the last comment */
show2 = true

/** line 1 */
/** line 2 - only this line will be shown */
t = 3

/** there can be any amount of space between the comment and the variable */



showFar = true

/** zero space is ok too */showNear = true

/**
Comments can be long.

# There's no markdown support yet.

Squiggle is a minimalist programming language for probabilistic estimation. It's meant for intuitively-driven quantitative estimation instead of data analysis or data-driven statistical techniques.

The basics of Squiggle are fairly straightforward. This can be enough for many models. The more advanced functionality can take some time to learn.
*/
long = true

/** dict comment */
r = {
  foo: 5,
  /** comments on static dict fields work too */
  bar: 6,
}
`,
  },
};

export const ManyTypes: Story = {
  name: "Many types",
  args: {
    defaultCode: `varNum = 3333
varBool = true
varString = "This is a long string"
varVoid = ()

varArray = [1,2,3]
varLambda = {|e| "Test"}
varScale = Scale.symlog({ min: -2, max: 5})

varDict = {fir: 1, secon: 2}

varTable = Table.make(
  {
    data: [1, 4, 5],
    columns: [
      { fn: {|e|e}, name: "Number" },
      { fn: {|e| normal(e^2, e^3)}, name: "Dist" },
      { fn: {|e|[e, e, e, e]}, name: "Array" },
      { fn: {|e|{first: e, second: e+1, third: e+2, fourth: e+3}}, name: "Dict" },
    ],
  }
)

varDist = SampleSet.fromDist(2 to 5)

varScatter = Plot.scatter({
  xDist: varDist,
  yDist: (-3 to 3) * 5 - varDist ^ 2
})
`,
    height: 800,
  },
};
