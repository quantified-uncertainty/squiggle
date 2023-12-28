#!/usr/bin/env node
import fs from "fs";

import {
  getAllFunctionNamesWithNamespace,
  getFunctionDocumentation,
} from "@quri/squiggle-lang";

const targetFilename = (name) => `./src/pages/docs/api/${name}.mdx`;

const intros = {
  Tag: `---
description: The Tag module handles tags, which allow the additions of metadata to Squiggle variables.
---
import { SquiggleEditor } from "@quri/squiggle-components";
# Tag
Tags are metadata that can be added to Squiggle variables. They are used to add additional information to variables, such as names, descriptions, and visualization options. While tags can be accessed at runtime, they are primarily meant for use with the Squiggle Playground and other visualizations.
Tags can be added to variables either by using their name \`Tag.[name]\` or by using decorators.
## Examples
<SquiggleEditor
defaultCode={\`@name("My Great Function") // Decorator syntax to add a name tag
@description("This is an example function.")
@showAs(Calculator) // Show this as a simple calculator in the Playground
exampleFn(f) = f^2
  
myVarTags = Tag.all(exampleFn)
  
description = Tag.getDescription(exampleFn)
  
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
  Date: `---
description: Dates are a simple date time type.
---
# Date`,
  Duration: `---
description: Durations are a simple time type, representing a length of time. They are internally stored as milliseconds, but often shown and written using seconds, minutes, hours, days, etc.
---
# Duration
Durations are a simple time type, representing a length of time. They are internally stored as milliseconds, but often shown and written using seconds, minutes, hours, days, etc.

| Unit Name | Example with Shorthand | Function to convert number to duration | Function to convert duration to number |   |   |   |   |   |   |
|-----------|------------------------|----------------------------------------|----------------------------------------|---|---|---|---|---|---|
| Minute    | 5minutes               | fromMinutes(number)                    | toMinutes(duration)                    |   |   |   |   |   |   |
| Hour      | 5hours                 | fromHours(number)                      | toHours(duration)                      |   |   |   |   |   |   |
| Day       | 5days                  | fromDays(number)                       | toDays(duration)                       |   |   |   |   |   |   |
| Year      | 5years                 | fromYears(number)                      | 

`,
};

function toMarkdownDefinitions(definitions) {
  return `\`\`\`
  ${definitions.join("\n")}
  \`\`\``;
}

function toMarkdown(documentation) {
  return `### ${documentation.name}
      ${
        documentation.signatures
          ? toMarkdownDefinitions(documentation.signatures)
          : ""
      }
      ${documentation.description || ""}
      `;
}

const main = async (namespace) => {
  const namespaceNames = getAllFunctionNamesWithNamespace(namespace);
  const content =
    intros[namespace] +
    "\n" +
    namespaceNames
      .map((name) => {
        return toMarkdown(getFunctionDocumentation(name));
      })
      .join("\n\n");
  fs.writeFile(targetFilename(namespace), content, (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(`Content written to ${targetFilename(namespace)}`);
  });
};

//Remember to add any new Modules to .gitignore
main("Tag");
main("Date");
main("Duration");
