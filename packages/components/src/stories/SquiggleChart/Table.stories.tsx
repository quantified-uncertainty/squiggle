import type { Meta, StoryObj } from "@storybook/react";

import { SquiggleChart } from "../../components/SquiggleChart.js";

/**
 * `Plot.scatter` objects in Squiggle are rendered with this chart.
 */
const meta = {
  component: SquiggleChart,
} satisfies Meta<typeof SquiggleChart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    code: `
    Plot.table({
      elements: [1,4,5],
      fns:[{|e| e}, {|e| {|t| t + e}}, {|e| [e,e,e,e]}] 
    })
`,
  },
};

export const Long: Story = {
  args: {
    code: `
    blog_post_to_software = SampleSet.fromDist(0.1 to 100)

    items = {
      quri_papers_1: {
        name: "External Evaluation of the EA Wiki",
        id: "quri_papers_1",
        value: mx(1),
      },
      quri_papers_2: {
        name: "Flimsy Pet Theories, Enormous Initiatives",
        id: "quri_papers_2",
        value: 0.1 to 2,
      },
      quri_papers_3: {
        name: "Simple comparison polling to create utility functions",
        id: "quri_papers_3",
        value: 0.5 to 10,
      },
      quri_papers_4: {
        name: "Prioritization Research for Advancing Wisdom and Intelligence",
        id: "quri_papers_4",
        value: 0.2 to 20,
      },
      quri_papers_5: {
        name: "Shallow evaluations of longtermist organizations",
        id: "quri_papers_5",
        value: 0.2 to 3,
      }
    }
    
    
    Plot.table({
          elements: items -> Dict.values,
          fns:[{|e| e.name}, {|e| e.id}, {|e| e.value}] 
        })
`,
  },
};
