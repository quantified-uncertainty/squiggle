import type { Meta, StoryObj } from "@storybook/react";

import {
  type FnDocumentation as FnDocumentationType,
  getAllFunctionNames,
  getFunctionDocumentation,
} from "@quri/squiggle-lang";

import { FnDocumentation as Component } from "../../components/ui/FnDocumentation.js";

/**
 * Internal UI component. Used in `SquigglePlayground`.
 */
const meta: Meta<typeof Component> = {
  component: Component,
};
export default meta;
type Story = StoryObj<typeof meta>;

export const FnStory = () => {
  const fnNames = getAllFunctionNames();
  const fnDocumentation = fnNames.map(getFunctionDocumentation);

  return (
    <div>
      {fnDocumentation.map((e, i) =>
        e ? (
          <div className="pb-2" key={i}>
            <Component documentation={e} showNameAndDescription={true} />
          </div>
        ) : (
          ""
        )
      )}
    </div>
  );
};

FnStory.story = {
  name: "All",
};

const fnDocumentation = getFunctionDocumentation("Plot.dists");
if (!fnDocumentation) {
  throw new Error("fnDocumentation is undefined");
}

const exampleDocumentation: FnDocumentationType = {
  name: "add",
  nameSpace: "Number",
  requiresNamespace: false,
  signatures: ["(number, number) => number"],
  examples: [
    `xDist = SampleSet.fromDist(2 to 5)
yDist = normal({p5:-3, p95:3}) * 5 - xDist ^ 2
Plot.scatter({
  xDist: xDist,
  yDist: yDist,
  xScale: Scale.log({min: 1.5}),
})`,
  ],
  interactiveExamples: [
    `xDist = SampleSet.fromDist(2 to 5)
yDist = normal({p5:-3, p95:3}) * 5 - xDist ^ 2
Plot.scatter({
  xDist: xDist,
  yDist: yDist,
  xScale: Scale.log({min: 1.5}),
})`,
    `xDist = SampleSet.fromDist(normal({p5:-2, p95:5}))
yDist = normal({p5:-3, p95:3}) * 5 - xDist
Plot.scatter({
  title: "A Scatterplot",
  xDist: xDist,
  yDist: yDist,
  xScale: Scale.symlog({title: "X Axis Title"}),
  yScale: Scale.symlog({title: "Y Axis Title"}),
})`,
  ],
  isExperimental: true,
  definitions: [],
  isUnit: true,
  shorthand: { type: "unary", symbol: "-" },
  description: `**Lorem Ipsum**
More content *here*`,
  versionAdded: "0.9.0",
};

export const Simple: Story = {
  name: "Normal",
  args: {
    documentation: exampleDocumentation,
    showNameAndDescription: true,
    size: "normal",
  },
};

export const Existing: Story = {
  name: "Existing",
  args: {
    documentation: fnDocumentation,
    showNameAndDescription: true,
    size: "small",
  },
};
