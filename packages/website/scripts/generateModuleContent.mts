#!/usr/bin/env node
import {
  FnDocumentation,
  getAllFunctionNamesWithNamespace,
  getFunctionDocumentation,
} from "@quri/squiggle-lang";

import { ModulePage, ModulePageSection } from "../templates.mjs";

//We need to escape the curly braces in the markdown for .jsx files.
function escapedStr(str: string) {
  return str.replace(/{/g, "\\{").replace(/}/g, "\\}");
}

function toMarkdown(documentation: FnDocumentation) {
  const fullName = documentation.nameSpace + "." + documentation.name;
  return `### ${documentation.name}
  ${escapedStr(documentation.description || "")}
  <FnDocumentationFromName functionName="${fullName}" showNameAndDescription={false} size="small" />
  `;
}

export function generateModuleContent(
  { name, description, intro, sections }: ModulePage,
  itemFn = toMarkdown
) {
  // const itemFn = toJSON;
  const namespaceNames = getAllFunctionNamesWithNamespace(name);
  let fnDocumentationItems = namespaceNames
    .map(getFunctionDocumentation)
    .filter((fn): fn is FnDocumentation => Boolean(fn && !fn.isUnit));

  const processSection = (section: ModulePageSection) => {
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
    const sectionItems = sectionFnDocumentationItems.map(itemFn).join("\n");
    return `${sectionHeader || ""}${sectionDescription || ""}${sectionItems}`;
  };

  let functionSection;
  if (sections && sections.length > 0) {
    functionSection = sections.map(processSection).join("\n\n");
  } else {
    functionSection = fnDocumentationItems.map(itemFn).join("\n\n");
  }

  const content = `---
description: ${description}
---
import { SquiggleEditor, FnDocumentationFromName } from "@quri/squiggle-components";

# ${name}
${intro}

${functionSection}`;
  return content;
}
