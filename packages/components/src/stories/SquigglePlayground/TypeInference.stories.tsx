import type { Meta, StoryObj } from "@storybook/react";

import { sq } from "@quri/squiggle-lang";

import { SquigglePlayground as Component } from "../../components/SquigglePlayground/index.js";

const meta: Meta<typeof Component> = {
  component: Component,
};
export default meta;
type Story = StoryObj<typeof meta>;

export const BasicExamples: Story = {
  args: {
    defaultCode: sq`// This example is wrapped in a function so that we only show types.
// For top-level variables we'd show both types and values.

typeInference() = {
  // hover over "x" to see its type; should be Number
  x = 1

  // Number
  // inference is based on the arguments to the builtin "+" infix operator
  y = 1 + 1

  // (any) => Number|Dist|String
  // "+" is polymorphic and "x" type is unknown.
  f(x) = x + 1

  // Number|Dist|String
  // "f" output type is a union; we can't narrow it based on argument type yet.
  z = f(1)

  // Number|Dist
  // - "z" is Number|Dist|String
  // - "/" is polymorphic but doesn't have signatures with String
  d = z / z

  // List('B) (i.e., List(any))
  // Generics are not implemented yet
  l = [1,2,3] -> map({|x| x})
  
  "fake result"
}

`,
    height: 800,
  },
};

export const TypeAndValue: Story = {
  args: {
    defaultCode: sq`// This is a top-level variable, so we show both its type and its value.
// Somewhat confusingly, the value is more specific than the type; the type should be "Number|Dist|String" and the value is clearly a number.
topLevelNumber = ({|x| x + 1})(1)
`,
  },
};

export const PropertyTypes: Story = {
  args: {
    defaultCode: sq`f() = {
    d = {
        foo: 5,
        bar: { x : 1 },
        baz: [1,2,3]
    }
    foo = d.foo
    foo2 = d["foo"]
    x = d.bar.x
    y = d.baz[1]
    "result"
}
`,
  },
};
