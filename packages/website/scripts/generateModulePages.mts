#!/usr/bin/env node
import fs from "fs";

import { FnDocumentation } from "@quri/squiggle-lang";

import { ModulePage, modulePages } from "../templates.mjs";
import { generateModuleContent } from "./generateModuleContent.mjs";
import { writeFile } from "./utils";

const directoryPath = `./content/docs/Api`;
if (!fs.existsSync(directoryPath)) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

const targetFilename = (name: string) => `${directoryPath}/${name}.mdx`;

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

async function generateModulePage(
  { name, description, intro, sections }: ModulePage,
  itemFn = toMarkdown
) {
  const content = generateModuleContent(
    { name, description, intro, sections },
    itemFn
  );

  writeFile(targetFilename(name), content);
}

async function generateMetaPage({ pages }: { pages: ModulePage[] }) {
  const fileName = `${directoryPath}/meta.json`;
  const content = JSON.stringify(
    {
      title: "API",
      pages: pages.map((p) => p.name),
    },
    null,
    2
  );

  writeFile(fileName, content);
}

for (const modulePage of modulePages) {
  await generateModulePage(modulePage, toMarkdown);
}

await generateMetaPage({ pages: modulePages });
