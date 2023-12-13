import type { Meta, StoryObj } from "@storybook/react";

import {
  type FnDocumentation as FnDocumentationType,
  getAllFunctionNames,
  getFunctionDocumentation,
} from "@quri/squiggle-lang";

import { FnDocumentation as Component } from "../components/ui/FnDocumentation.js";

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
            <Component documentation={e} />
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

const documentation: FnDocumentationType = {
  name: "add",
  nameSpace: "Number",
  requiresNamespace: false,
  signatures: ["(number, number) => number"],
  examples: ["add(5,2)"],
  isExperimental: true,
  definitions: [],
  isUnit: true,
  shorthand: { type: "unary", symbol: "-" },
  description: `**Lorem Ipsum**
More content *here*`,
};

export const Simple: Story = {
  name: "Normal",
  args: {
    documentation,
  },
};
