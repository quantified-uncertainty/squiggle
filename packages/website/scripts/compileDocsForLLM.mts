#!/usr/bin/env node
import { glob } from "glob";

import { FnDocumentation } from "@quri/squiggle-lang";

import { modulePages } from "../templates.mjs";
import { generateModuleContent } from "./generateModuleContent.mjs";
import { readFile, writeFile } from "./utils";

function moduleItemToCompressedFormat({
  name,
  description,
  nameSpace,
  signatures,
  shorthand,
  examples,
}: FnDocumentation): string {
  // Function signature line
  const sigLine = `${nameSpace ? nameSpace + "." : ""}${name}${shorthand ? " " + shorthand.symbol : ""}: ${signatures.join(", ")}`;

  // Description
  const descLine = description ? `\n${description}` : "";

  // Examples
  let exampleLines = "";
  if (examples && Array.isArray(examples) && examples.length > 0) {
    exampleLines = "\n" + examples.map((e) => e.text).join("\n");
  }

  return `${sigLine}${descLine}${exampleLines}\n`;
}

function convertSquiggleEditorTags(input: string): string {
  // Replace opening tags and everything up to the closing />
  let result = input.replace(
    /<SquiggleEditor[\s\S]*?defaultCode=\{`([\s\S]*?)`\}\s*\/>/g,
    (match, codeContent) => {
      return "```squiggle\n" + codeContent.trim() + "\n```";
    }
  );

  return result;
}

function removeHeaderLines(content: string): string {
  // Split the content into lines
  const lines = content.split("\n");

  // Find the index of the first title (line starting with '#')
  const firstTitleIndex = lines.findIndex((line) =>
    line.trim().startsWith("#")
  );

  // If a title is found, remove everything before it
  if (firstTitleIndex !== -1) {
    return lines.slice(firstTitleIndex).join("\n");
  }

  // If no title is found, return the original content
  return content;
}

function allDocumentationItems() {
  return modulePages
    .map((page) => generateModuleContent(page, moduleItemToCompressedFormat))
    .join("\n\n\n");
}

const basicPrompt = readFile("./src/mdx/basicPrompt.mdx");
const styleGuideRaw = readFile("./public/llms/styleGuide.markdown");
const documentationBundlePage = async () => {
  const targetFilename = "./public/llms/documentationBundle.markdown";

  // We're not using this anymore, but leaving it here in case we want it again.
  const getGrammarContent = async () => {
    const grammarFiles = await glob("../squiggle-lang/src/**/*.peggy");
    return readFile(grammarFiles[0]);
  };

  const getGuideContent = async () => {
    const documentationFiles = await glob("./src/pages/docs/Guides/*.{md,mdx}");
    return Promise.all(
      documentationFiles
        .filter(
          (filePath) =>
            !filePath.endsWith("Roadmap.md") &&
            !filePath.endsWith("Debugging.mdx")
        )
        .map(async (filePath) => {
          const content = readFile(filePath);
          const withoutHeaders = removeHeaderLines(content);
          const convertedContent = convertSquiggleEditorTags(withoutHeaders);
          return convertedContent;
        })
    ).then((contents) => contents.join("\n\n\n"));
  };

  console.log("Compiling documentation bundle page...");
  // const grammarContent = await getGrammarContent();
  const guideContent = await getGuideContent();
  const apiContent = allDocumentationItems();
  const content =
    basicPrompt +
    "\n\n" +
    styleGuideRaw +
    "\n\n" +
    // `## Peggy Grammar \n\n ${grammarContent} \n\n --- \n\n ` +
    convertSquiggleEditorTags(guideContent) +
    apiContent;

  writeFile(targetFilename, content);
};

async function main() {
  await documentationBundlePage();
}

main();
