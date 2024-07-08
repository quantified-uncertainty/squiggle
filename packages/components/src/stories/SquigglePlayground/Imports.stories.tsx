import type { Meta, StoryObj } from "@storybook/react";

import { makeSelfContainedLinker } from "@quri/squiggle-lang";

import { SquigglePlayground as Component } from "../../components/SquigglePlayground/index.js";

const meta: Meta<typeof Component> = {
  component: Component,
};
export default meta;
type Story = StoryObj<typeof meta>;

export const ImportsWithTooltips: Story = {
  args: {
    linker: makeSelfContainedLinker({
      source1: `export x = 1`,
      source2: `export y = 2`,
    }),
    defaultCode: `import "source1" as s1
import "source2" as s2

x = s1
`,
    renderImportTooltip: ({ importId }) => (
      <div className="p-2">
        <span className="font-medium text-slate-500">Import:</span> {importId}
      </div>
    ),
  },
};

export const InvalidImportName: Story = {
  args: {
    linker: makeSelfContainedLinker({}),
    defaultCode: `import "non-existent" as non
x = 1
`,
  },
};

export const InvalidImportCode: Story = {
  args: {
    linker: makeSelfContainedLinker({
      source1: `export x = 1 + // syntax error`,
    }),
    defaultCode: `import "source1" as s1
x = 1
`,
  },
};
