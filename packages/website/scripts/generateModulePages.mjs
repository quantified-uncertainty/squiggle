#!/usr/bin/env node
import fs from "fs";

import { modulePages } from "../templates.mjs";
import { generateModuleContent } from "./generateModuleContent.mjs";

const targetFilename = (name) => `./src/pages/docs/Api/${name}.mdx`;

//We need to escape the curly braces in the markdown for .jsx files.
function escapedStr(str) {
  return str.replace(/{/g, "\\{").replace(/}/g, "\\}");
}

function toMarkdown(documentation) {
  const fullName = documentation.nameSpace + "." + documentation.name;
  return `### ${documentation.name}${escapedStr(
    documentation.description || ""
  )}
<FnDocumentationFromName functionName="${fullName}" showNameAndDescription={false} size="small" />
`;
}

const generateModulePage = async (
  { name, description, intro, sections },
  itemFn = toMarkdown
) => {
  const content = generateModuleContent(
    { name, description, intro, sections },
    itemFn
  );

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
  await generateModulePage(modulePage, toMarkdown);
}
