export type ModulePageSection = { name: string; description?: string };

export type ModulePage = {
  name: string;
  description: string;
  sections?: ModulePageSection[];
  intro: string;
};

export const modulePages: ModulePage[] = [
  {
    name: "Tag",
    description:
      "The Tag module handles tags, which allow the additions of metadata to Squiggle variables.",
    sections: [{ name: "Tags" }, { name: "Functions" }],
    intro: `Tags are metadata that can be added to Squiggle variables. They are used to add additional information to variables, such as names, descriptions, and visualization options. While tags can be accessed at runtime, they are primarily meant for use with the Squiggle Playground and other visualizations.
Tags can be added to variables either by using their name \`Tag.[name]\` or by using decorators.

## List of Tags
| Tag Name    | Description |
| --------- | ----------- |
| \`name\` | Change the default display name for the variable, in the playground.       |
| \`doc\` | Adds documentation to the variable in the playground.       |
| \`showAs\` | Change the default view for the value when displayed. |
| \`format\` | Format a number, date, or duration when displayed. |
| \`hide\` | Don't show the variable in the playground |

## Examples
<SquiggleEditor
defaultCode={\`@name("My Great Function") // Decorator syntax to add a name tag
@doc("This is an example function.")
@showAs(Calculator) // Show this as a simple calculator in the Playground
exampleFn(f) = f^2
  
myVarTags = Tag.all(exampleFn)
  
docs = Tag.getDoc(exampleFn)
  
@hide // Hide this variable in the Playground
helperFn(f) = f \`}/>
`,
  },
  {
    description: "Dates are a simple date time type.",
    name: "Date",
    intro: ``,
    sections: [
      { name: "Constructors" },
      { name: "Conversions" },
      { name: "Algebra" },
      { name: "Comparison" },
      { name: "Other" },
    ],
  },
  {
    name: "Duration",
    description:
      "Durations are a simple time type, representing a length of time. They are internally stored as milliseconds, but often shown and written using seconds, minutes, hours, days, etc.",
    sections: [
      { name: "Constructors" },
      { name: "Conversions" },
      { name: "Algebra" },
      { name: "Comparison" },
    ],
    intro: `Durations are a simple time type, representing a length of time. They are internally stored as milliseconds, but often shown and written using seconds, minutes, hours, days, etc.


| **Unit Name** | **Example** | **Convert Number to Duration** | **Convert Duration to Number** |
|---------------|----------------------------|--------------------------------------------|--------------------------------------------|
| Minute        | \`5minutes\`                   | \`fromMinutes(number)\`                      | \`toMinutes(duration)\`                      |
| Hour          | \`5hour\`                     | \`fromHours(number)\`                        | \`toHours(duration)\`                        |
| Day           | \`5days\`                      | \`fromDays(number)\`                         | \`toDays(duration)\`                         |
| Year          | \`5years\`                     | \`fromYears(number)\`                        | \`toYears(duration)\`                        |

This table now presents the information in a clear and concise manner, focusing only on the essential columns.
`,
  },
  {
    name: "Calculator",
    description: "The Calculator module helps you create custom calculators",
    intro: `
The Calculator module allows you to make custom calculators for functions. This is a form that's tied to a specific Squiggle function, where the inputs to the form are passed to that function, and the output of the function gets shown on the bottom.

Calculators can be useful for debugging functions or to present functions to end users.
`,
  },
  {
    name: "Dict",
    sections: [
      { name: "Conversions" },
      { name: "Transformations" },
      { name: "Queries" },
    ],
    description:
      "Squiggle dictionaries work similar to Python dictionaries. The syntax is similar to objects in Javascript.",
    intro: `
`,
  },
  {
    name: "Boolean",
    description: "",
    intro: `
`,
  },
  {
    name: "Common",
    description: "",
    intro: `Functions that work on many different types of values.`,
  },
  {
    name: "Number",
    sections: [
      { name: "Comparison" },
      { name: "Algebra (Number)" },
      { name: "Functions (Number)" },
      { name: "Algebra (List)" },
      { name: "Functions (List)" },
      { name: "Utils" },
    ],
    description: "Squiggle numbers are Javascript floats.",
    intro: "Squiggle numbers are Javascript floats.",
  },
  {
    name: "RelativeValues",
    description: "",
    intro:
      "*Warning: Relative value functions are particularly experimental and subject to change.*",
  },
  {
    name: "String",
    description: "Functions for working with strings in Squiggle",
    intro: `Strings support all JSON escape sequences, with addition of escaped single-quotes (for single-quoted strings)

~~~squiggle
a = "'\" NUL:\u0000"
b = '\'" NUL:\u0000'
~~~`,
  },
  {
    name: "Input",
    description:
      "Inputs are now only used for describing forms for calculators.",
    intro: `Inputs are now only used for describing forms for [calculators](./Calculator.mdx).`,
  },
  {
    name: "SampleSet",
    sections: [
      { name: "Constructors" },
      { name: "Conversions" },
      { name: "Transformations" },
    ],
    description:
      "Sample set distributions are one of the three distribution formats. Internally, they are stored as a list of numbers.",
    intro: `Sample set distributions are one of the three distribution formats. Internally, they are stored as a list of numbers. It's useful to distinguish point set distributions from arbitrary lists of numbers to make it clear which functions are applicable.

Monte Carlo calculations typically result in sample set distributions.

All regular distribution function work on sample set distributions. In addition, there are several functions that only work on sample set distributions..`,
  },
  {
    name: "PointSet",
    sections: [
      { name: "Constructors" },
      { name: "Conversions" },
      { name: "Transformations" },
    ],
    description:
      "Point set distributions are one of the three distribution formats. They are stored as a list of x-y coordinates representing both discrete and continuous distributions.",
    intro: `Point set distributions are one of the three distribution formats. They are stored as a list of x-y coordinates representing both discrete and continuous distributions.

One complication is that it's possible to represent invalid probability distributions in the point set format. For example, you can represent shapes with negative values, or shapes that are not normalized.`,
  },
  {
    name: "Sym",
    description:
      "The Sym module provides functions to create some common symbolic distributions.",
    intro: `Symbolic Distributions. All these functions match the functions for creating sample set distributions, but produce symbolic distributions instead. Symbolic distributions won't capture correlations, but are more performant than sample distributions.`,
  },
  {
    name: "Scale",
    description: "Scales for plots.",
    sections: [{ name: "Numeric Scales" }, { name: "Date Scales" }],
    intro: `Chart axes in [plots](./Plot.mdx) can be scaled using the following functions. Each scale function accepts optional min and max value. Power scale accepts an extra exponent parameter.

Squiggle uses D3 for the tick formats. You can read about d3 tick formats [here](https://github.com/d3/d3-format).`,
  },
  {
    name: "List",
    description:
      "Lists are a simple data structure that can hold any type of value. They are similar to arrays in Javascript or lists in Python.",
    sections: [
      { name: "Constructors" },
      { name: "Modifications" },
      { name: "Filtering" },
      { name: "Queries" },
      { name: "Functional Transformations" },
    ],
    intro: `Lists are a simple data structure that can hold any type of value. They are similar to arrays in Javascript or lists in Python.

\`\`\`squiggle
myList = [1, 2, 3, normal(5,2), "hello"]
\`\`\`

Lists are immutable, meaning that they cannot be modified. Instead, all list functions return a new list.`,
  },
  {
    name: "Danger",
    description:
      "Newer experimental functions which are less stable than Squiggle as a whole",
    sections: [
      { name: "JSON" },
      { name: "Math" },
      { name: "Combinatorics" },
      { name: "Distributions" },
      { name: "Distribution Functions" },
      { name: "Integration" },
      { name: "Optimization" },
    ],
    intro: `The Danger library contains newer experimental functions which are less stable than Squiggle as a whole. They are not recommended for production use, but are useful for testing out new ideas., 
`,
  },
  {
    name: "Dist",
    sections: [
      {
        name: "Distributions",
        description: `These are functions for creating primitive distributions. Many of these could optionally take in distributions as inputs. In these cases, Monte Carlo Sampling will be used to generate the greater distribution. This can be used for simple hierarchical models.

See a longer tutorial on creating distributions [here](/docs/Guides/DistributionCreation).`,
      },
      { name: "Basic Functions" },
      { name: "Algebra (Dist)" },
      { name: "Algebra (List)" },
      {
        name: "Pointwise Algebra",
        description: `Pointwise arithmetic operations cover the standard arithmetic operations, but work in a different way than the regular operations. These operate on the y-values of the distributions instead of the x-values. A pointwise addition would add the y-values of two distributions.

The infixes \`.+\`,\`.-\`, \`.*\`, \`./\`, \`.^\` are supported for their respective operations. \`Mixture\` works using pointwise addition. 

Pointwise operations work on Point Set distributions, so will convert other distributions to Point Set ones first. Pointwise arithmetic operations typically return unnormalized or completely invalid distributions. For example, the operation{" "} <code>normal(5,2) .- uniform(10,12)</code> results in a distribution-like object with negative probability mass.`,
      },
      {
        name: "Normalization",
        description: `There are some situations where computation will return unnormalized distributions. This means that their cumulative sums are not equal to 1.0. Unnormalized distributions are not valid for many relevant functions; for example, klDivergence and scoring.

The only functions that do not return normalized distributions are the pointwise arithmetic operations and the scalewise arithmetic operations. If you use these functions, it is recommended that you consider normalizing the resulting distributions.`,
      },
      { name: "Utility" },
      { name: "Scoring" },
    ],
    description:
      "Point set distributions are one of the three distribution formats. They are stored as a list of x-y coordinates representing both discrete and continuous distributions.",
    intro: `Point set distributions are one of the three distribution formats. They are stored as a list of x-y coordinates representing both discrete and continuous distributions.

One complication is that it's possible to represent invalid probability distributions in the point set format. For example, you can represent shapes with negative values, or shapes that are not normalized.`,
  },
];
