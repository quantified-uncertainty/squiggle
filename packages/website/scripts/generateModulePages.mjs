#!/usr/bin/env node
import fs from "fs";

import {
  getAllFunctionNamesWithNamespace,
  getFunctionDocumentation,
} from "@quri/squiggle-lang";

import { sections } from "../templates.mjs";

const targetFilename = (name) => `./src/pages/docs/Api/${name}.mdx`;

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
  }" showNameAndDescription={false} size="small" />
`;
}

const main = async ({ name, description, imports, intro, sections }) => {
  const namespaceNames = getAllFunctionNamesWithNamespace(name);
  let functionSection = namespaceNames
    .map(getFunctionDocumentation)
    .filter(({ isUnit }) => isUnit == false);
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
