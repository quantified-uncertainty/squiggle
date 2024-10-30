import {
  FnDocumentation,
  getAllFunctionNamesWithNamespace,
  getFunctionDocumentation,
} from "@quri/squiggle-lang";

import { type ApiModuleDoc } from "./collections/apiDocs";
import { docTitleFromMeta } from "./collections/utils";

// We need to escape the curly braces in the markdown for .jsx files.
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

export function generateApiFunctionSection(
  doc: ApiModuleDoc,
  itemFn = toMarkdown
) {
  const title = docTitleFromMeta(doc._meta);

  const namespaceNames = getAllFunctionNamesWithNamespace(title);
  const fnDocumentationItems = namespaceNames
    .map(getFunctionDocumentation)
    .filter((fn): fn is FnDocumentation => Boolean(fn && !fn.isUnit));

  const processSection = (
    section: NonNullable<ApiModuleDoc["sections"]>[number]
  ) => {
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
  if (doc.sections && doc.sections.length > 0) {
    functionSection = doc.sections.map(processSection).join("\n\n");
  } else {
    functionSection = fnDocumentationItems.map(itemFn).join("\n\n");
  }

  return functionSection;
}
