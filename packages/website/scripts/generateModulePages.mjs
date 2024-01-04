#!/usr/bin/env node
import fs from "fs";

import {
  getAllFunctionNamesWithNamespace,
  getFunctionDocumentation,
} from "@quri/squiggle-lang";

import { modulePages } from "../templates.mjs";

const targetFilename = (name) => `./src/pages/docs/Api/${name}.mdx`;

//We need to escape the curly braces in the markdown for .jsx files.
function escapedStr(str) {
  return str.replace(/{/g, "\\{").replace(/}/g, "\\}");
}

function toMarkdown(documentation) {
  const fullName = documentation.nameSpace + "." + documentation.name;
  return `### ${documentation.name}
${escapedStr(documentation.description || "")}
<FnDocumentationFromName functionName="${fullName}" showNameAndDescription={false} size="small" />
`;
}

const generateModulePage = async ({ name, description, intro, sections }) => {
  const namespaceNames = getAllFunctionNamesWithNamespace(name);
  let fnDocumentationItems = namespaceNames
    .map(getFunctionDocumentation)
    .filter(({ isUnit }) => !isUnit);

  const processSection = (section) => {
    const sectionFnDocumentationItems = fnDocumentationItems.filter(
      ({ displaySection }) => displaySection === section.name
    );
    if (sectionFnDocumentationItems.length === 0) {
      throw new Error(
        `Error: No functions in section: ${name} ${section.name}. You likely made an error in the section name.`
      );
    }

    const sectionHeader = section.name && `## ${section.name}\n\n`;
    const sectionDescription =
      section.description && `${section.description}\n\n`;
    const sectionItems = sectionFnDocumentationItems.map(toMarkdown).join("\n");
    return `${sectionHeader || ""}${sectionDescription || ""}${sectionItems}`;
  };

  let functionSection;
  if (sections?.length > 0) {
    functionSection = sections.map(processSection).join("\n\n");
  } else {
    functionSection = fnDocumentationItems.map(toMarkdown).join("\n\n");
  }

  const content = `---
description: ${description}
---
import { SquiggleEditor, FnDocumentationFromName } from "@quri/squiggle-components";

# ${name}
${intro}

${functionSection}`;

  fs.writeFile(targetFilename(name), content, (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(`Content written to ${targetFilename(name)}`);
  });
};

//Remember to add any new Modules to .gitignore
for (const modulePage of modulePages) {
  await generateModulePage(modulePage);
}
