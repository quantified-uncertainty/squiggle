#!/usr/bin/env node
import fs from "fs";

import {
  getAllFunctionNamesWithNamespace,
  getFunctionDocumentation,
} from "@quri/squiggle-lang";

const targetFilename = (name) => `./src/pages/docs/api/${name}.md`;
const targetFilename2 = (name) => `./src/pages/api/${name}.md`;
const targetFilename3 = (name) => `./src/pages/docs/Ecosystems${name}.md`;

const sections = [
  {
    name: "Tag",
    intro: `---
description: The Tag module handles tags, which allow the additions of metadata to Squiggle variables.
---
import { SquiggleEditor, FnDocumentationFromName } from "@quri/squiggle-components";

# Tag
Tags are metadata that can be added to Squiggle variables. They are used to add additional information to variables, such as names, descriptions, and visualization options. While tags can be accessed at runtime, they are primarily meant for use with the Squiggle Playground and other visualizations.
Tags can be added to variables either by using their name \`Tag.[name]\` or by using decorators.
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
## List of Tags
| Tag Name    | Description |
| --------- | ----------- |
| \`name\` | Change the default display name for the variable, in the Playground.       |
| \`description\` | Adds a description to the variable in the playground.       |
| \`showAs\` | Change the default view for the value when displayed. |
| \`format\` | Format a number, date, or duration when displayed. |
| \`hide\` | Don't show the variable in the Playground |
## Definitions
`,
  },
  {
    name: "Date",
    intro: `---
description: Dates are a simple date time type.
---
import { SquiggleEditor, FnDocumentationFromName } from "@quri/squiggle-components";

# Date`,
  },
  {
    name: "Duration",
    intro: `---
description: Durations are a simple time type, representing a length of time. They are internally stored as milliseconds, but often shown and written using seconds, minutes, hours, days, etc.
---
import { SquiggleEditor, FnDocumentationFromName } from "@quri/squiggle-components";

# Duration
Durations are a simple time type, representing a length of time. They are internally stored as milliseconds, but often shown and written using seconds, minutes, hours, days, etc.


| **Unit Name** | **Example** | **Convert Number to Duration** | **Convert Duration to Number** |
|---------------|----------------------------|--------------------------------------------|--------------------------------------------|
| Minute        | \`5minutes\`                   | \`fromMinutes(number)\`                      | \`toMinutes(duration)\`                      |
| Hour          | \`5hour\`                     | \`romHours(number)\`                        | \`toHours(duration)\`                        |
| Day           | \`5days\`                      | \`fromDays(number)\`                         | \`toDays(duration)\`                         |
| Year          | \`5years\`                     | \`fromYears(number)\`                        | \`toYears(duration)\`                        |

This table now presents the information in a clear and concise manner, focusing only on the essential columns.
`,
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

const main = async ({ name, intro }) => {
  const namespaceNames = getAllFunctionNamesWithNamespace(name);
  const content =
    intro +
    "\n" +
    namespaceNames
      .map((name) => {
        return toMarkdown(getFunctionDocumentation(name));
      })
      .join("\n");
  fs.writeFile(targetFilename(name), content, (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(`Content written to ${targetFilename(name)}`);
  });
  fs.writeFile(targetFilename2(name), content, (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(`Content written to ${targetFilename2(name)}`);
  });
  fs.writeFile(targetFilename3(name), content, (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(`Content written to ${targetFilename3(name)}`);
  });
  console.log("CONTENT TO WRITE", content);
};

//Remember to add any new Modules to .gitignore
for (const section of sections) {
  console.log("Generating", section.name);
  await main(section);
}
