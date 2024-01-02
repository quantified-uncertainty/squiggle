#!/usr/bin/env node
import fs from "fs";

import {
  getAllFunctionNamesWithNamespace,
  getFunctionDocumentation,
} from "@quri/squiggle-lang";

const targetFilename = (name) => `./src/pages/docs/Api/${name}.mdx`;

const sections = [
  {
    name: "Tag",
    description:
      "The Tag module handles tags, which allow the additions of metadata to Squiggle variables.",
    imports: `import { SquiggleEditor, FnDocumentationFromName } from "@quri/squiggle-components";`,
    intro: `Tags are metadata that can be added to Squiggle variables. They are used to add additional information to variables, such as names, descriptions, and visualization options. While tags can be accessed at runtime, they are primarily meant for use with the Squiggle Playground and other visualizations.
Tags can be added to variables either by using their name \`Tag.[name]\` or by using decorators.

## List of Tags
| Tag Name    | Description |
| --------- | ----------- |
| \`name\` | Change the default display name for the variable, in the Playground.       |
| \`doc\` | Adds documentation to the variable in the playground.       |
| \`showAs\` | Change the default view for the value when displayed. |
| \`format\` | Format a number, date, or duration when displayed. |
| \`hide\` | Don't show the variable in the Playground |

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

## Definitions
`,
  },
  {
    description: "Dates are a simple date time type.",
    imports: `import { SquiggleEditor, FnDocumentationFromName } from "@quri/squiggle-components";`,
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
    imports: `import { SquiggleEditor, FnDocumentationFromName } from "@quri/squiggle-components";`,
    intro: `Durations are a simple time type, representing a length of time. They are internally stored as milliseconds, but often shown and written using seconds, minutes, hours, days, etc.


| **Unit Name** | **Example** | **Convert Number to Duration** | **Convert Duration to Number** |
|---------------|----------------------------|--------------------------------------------|--------------------------------------------|
| Minute        | \`5minutes\`                   | \`fromMinutes(number)\`                      | \`toMinutes(duration)\`                      |
| Hour          | \`5hour\`                     | \`romHours(number)\`                        | \`toHours(duration)\`                        |
| Day           | \`5days\`                      | \`fromDays(number)\`                         | \`toDays(duration)\`                         |
| Year          | \`5years\`                     | \`fromYears(number)\`                        | \`toYears(duration)\`                        |

This table now presents the information in a clear and concise manner, focusing only on the essential columns.
`,
  },
  {
    name: "Calculator",
    description: "The Calculator module helps you create custom calculators",
    imports: `import { SquiggleEditor, FnDocumentationFromName } from "@quri/squiggle-components";`,
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
    imports: `import { SquiggleEditor, FnDocumentationFromName } from "@quri/squiggle-components";`,
    intro: `
`,
  },
  {
    name: "Input",
    description:
      "Inputs are now only used for describing forms for calculators.",
    imports: `import { SquiggleEditor, FnDocumentationFromName } from "@quri/squiggle-components";`,
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
    imports: `import { FnDocumentationFromName } from "@quri/squiggle-components";`,
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
    imports: `import { FnDocumentationFromName } from "@quri/squiggle-components";`,
    intro: `Point set distributions are one of the three distribution formats. They are stored as a list of x-y coordinates representing both discrete and continuous distributions.

One complication is that it's possible to represent invalid probability distributions in the point set format. For example, you can represent shapes with negative values, or shapes that are not normalized.`,
  },
  {
    name: "Sym",
    description:
      "The Sym module provides functions to create some common symbolic distributions.",
    imports: `import { FnDocumentationFromName } from "@quri/squiggle-components";`,
    intro: `Symbolic Distributions. All these functions match the functions for creating sample set distributions, but produce symbolic distributions instead. Symbolic distributions won't capture correlations, but are more performant than sample distributions.`,
  },
  {
    name: "Scale",
    description: "Scales for plots.",
    sections: [{ name: "Numeric Scales" }, { name: "Date Scales" }],
    imports: `import { FnDocumentationFromName } from "@quri/squiggle-components";`,
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
    imports: `import { FnDocumentationFromName } from "@quri/squiggle-components";`,
    intro: `Lists are a simple data structure that can hold any type of value. They are similar to arrays in Javascript or lists in Python.

\`\`\`squiggle
myList = [1, 2, 3, normal(5,2), "hello"]
\`\`\`

Lists are immutable, meaning that they cannot be modified. Instead, all list functions return a new list.`,
  },
];

function toMarkdownDefinitions(definitions) {
  return `\`\`\`
  ${definitions.join("\n")}
  \`\`\``;
}

function toMarkdown(documentation) {
  return `### ${documentation.name}
${documentation.description || ""}
<FnDocumentationFromName functionName="${
    documentation.nameSpace + "." + documentation.name
  }" showNameAndDescription={false} size="medium" />
`;
}

const main = async ({ name, description, imports, intro, sections }) => {
  const namespaceNames = getAllFunctionNamesWithNamespace(name);
  let functionSection = namespaceNames.map(getFunctionDocumentation);
  if (sections && sections.length > 0) {
    functionSection = sections
      .map((section) => {
        const sectionName = section.name;
        const functionsInSection = functionSection.filter(
          ({ displaySection }) => displaySection == sectionName
        );
        if (functionsInSection.length === 0) {
          throw `Error: No functions in section: ${name} ${sectionName}}`;
        }
        const header = sectionName === "" ? "" : `## ${sectionName}\n\n`;
        const _items = functionsInSection.map(toMarkdown).join("\n");
        return header + _items;
      })
      .join("\n\n");
  } else {
    functionSection = functionSection.map(toMarkdown).join("\n\n");
  }
  const content =
    `---
description: ${description}
---
${imports}

# ${name}
${intro}
` + functionSection;
  fs.writeFile(targetFilename(name), content, (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(`Content written to ${targetFilename(name)}`);
  });
};

//Remember to add any new Modules to .gitignore
for (const section of sections) {
  await main(section);
}
