#!/usr/bin/env node
import fs from "fs";

import { FnDocumentation } from "@quri/squiggle-lang";

import { ModulePage, modulePages } from "../templates.mjs";
import { generateModuleContent } from "./generateModuleContent.mjs";

const targetFilename = (name: string) => `./src/pages/docs/Api/${name}.mdx`;

//We need to escape the curly braces in the markdown for .jsx files.
function escapedStr(str: string) {
  return str.replace(/{/g, "\\{").replace(/}/g, "\\}");
}

function toMarkdown(documentation: FnDocumentation) {
  const fullName = documentation.nameSpace + "." + documentation.name;
  return `### ${documentation.name}\n${escapedStr(
    documentation.description || ""
  )}
<FnDocumentationFromName functionName="${fullName}" showNameAndDescription={false} size="small" />
`;
}

const generateModulePage = async (
  { name, description, intro, sections }: ModulePage,
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

const generateMetaPage = async ({ pages }: { pages: ModulePage[] }) => {
  function convertToKeyValuePairs(names: string[]): { [key: string]: string } {
    const keyValuePairs: { [key: string]: string } = {};
    names.forEach((name) => {
      keyValuePairs[name] = name;
    });
    return keyValuePairs;
  }

  const names = pages.map((p) => p.name);
  const fileName = `./src/pages/docs/Api/_meta.json`;
  const content = JSON.stringify(convertToKeyValuePairs(names), null, 2);

  fs.writeFile(fileName, content, (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(`Content written to ${targetFilename(fileName)}`);
  });
};

for (const modulePage of modulePages) {
  await generateModulePage(modulePage, toMarkdown);
}

await generateMetaPage({ pages: modulePages });
