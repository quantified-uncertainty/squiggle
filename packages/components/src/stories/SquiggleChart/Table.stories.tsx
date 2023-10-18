import type { Meta, StoryObj } from "@storybook/react";

import { SquiggleChart } from "../../components/SquiggleChart.js";

const meta = {
  component: SquiggleChart,
} satisfies Meta<typeof SquiggleChart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    code: `
    Table.make(
      {
        title: "Basic Table",
        data: [1, 4, 5],
        columns: [
          { fn: {|e|e}, name: "Number" },
          { fn: {|e| normal(e^2, e^3)}, name: "Dist" },
          { fn: {|e|[e, e, e, e]}, name: "Array" },
          { fn: {|e|{first: e, second: e+1, third: e+2, fourth: e+3}}, name: "Dict" },
        ],
      }
    )
`,
  },
};

export const Long: Story = {
  args: {
    code: `
    blog_post_to_software = SampleSet.fromDist(1 to 100)

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
  },
  quri_papers_6: {
    name: "2018-2019 Long Term Future Fund Grantees: How did they do?",
    id: "quri_papers_6",
    value: 0.3 to 2,
  },
  quri_papers_7: {
    name: "Introducing Metaforecasting: A Forecast Aggregator and Search Tool",
    id: "quri_papers_7",
    value: 1 to 20,
  },
  quri_papers_8: {
    name: "Big List of Cause Candidates",
    id: "quri_papers_8",
    value: 0.5 to 8,
  },
  quri_papers_9: {
    name: "Multivariate estimation & the Squiggly language",
    id: "quri_papers_9",
    value: 0.2 to 8,
  },
  quri_papers_10: {
    name: "Amplifying generalist research via forecasting – results from a preliminary exploration Part 2",
    id: "quri_papers_10",
    value: 2 to 15,
  },
  quri_papers_11: {
    name: "Introducing http://foretold.io/: A New Open-Source Prediction Registry",
    id: "quri_papers_11",
    value: 1 to 5,
  },
  quri_papers_12: {
    name: "Conversation on forecasting with Vaniver and Ozzie Gooen",
    id: "quri_papers_12",
    value: 0.05 to 0.2,
  },
  quri_papers_13: {
    name: "Prediction-Augmented Evaluation Systems",
    id: "quri_papers_13",
    value: 0.1 to 3,
  },
  quri_papers_14: {
    name: "Five steps for quantifying speculative interventions",
    id: "quri_papers_14",
    value: 0.2 to 3,
  },
  quri_papers_15: {
    name: "Valuing research works by eliciting comparisons from EA researchers",
    id: "quri_papers_15",
    value: 0.2 to 3,
  },
  quri_metaforecast: {
    name: "Metaforecast",
    id: "quri_metaforecast",
    value: 1 * blog_post_to_software,
  },
  quri_metaforecast_twitter: {
    name: "Metaforecast Twitter Bot",
    id: "quri_metaforecast_twitter",
    value: (0.01 to 0.1) * blog_post_to_software,
  },
  quri_squiggle: {
    name: "Squiggle",
    id: "quri_squiggle",
    value: (3 to 10) * blog_post_to_software,
  },
  quri_foretold: {
    name: "Foretold.io",
    id: "quri_foretold",
    value: (0.5 to 100) * blog_post_to_software,
  },
  quri_homepage: {
    name: "QuantifiedUncertainty.org",
    id: "quri_homepage",
    value: (0.05 to 5) * blog_post_to_software,
  },
  quri_utility_extractor: {
    name: "Utility Function Extractor",
    id: "quri_utility_extractor",
    value: (0.005 to 0.2) * blog_post_to_software,
  },
  quri_ai_safety_papers: {
    name: "AI Safety Papers",
    id: "quri_ai_safety_papers",
    value: (0.01 to 0.5) * blog_post_to_software,
  },
  quri_ken: {
    name: "Ken",
    id: "quri_ken",
    value: (0.1 to 0.5) * blog_post_to_software,
  },
  quri_guesstimate: {
    name: "Guesstimate",
    id: "quri_guesstimate",
    value: (50 to 10000) * blog_post_to_software,
  },
}

Table.make(
  {
    data: items -> Dict.values,
    columns: [
      { fn: {|e|e.id}, title: "id" },
      { fn: {|e|e.name}, title: "name" },
      {
        fn: {|e|Plot.dist(
          {
            dist: e.value,
            xScale: Scale.symlog({ min: 0.01, max: 100000 }),
            showSummary: false,
          }
        )},
        title: "value",
      },
    ],
  }
)
`,
  },
};
