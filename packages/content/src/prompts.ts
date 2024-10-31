import { FnDocumentation } from "@quri/squiggle-lang";

import {
  allDocs,
  allMetas,
  allRawApiDocs,
} from "../.content-collections/generated/index.js";
import { generateApiFunctionSection } from "./apiUtils.js";

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

function allDocumentationItems() {
  return allRawApiDocs
    .map((doc) => {
      return (
        `# Builtin module: ${doc.title}\n\n` +
        doc.description +
        "\n\n" +
        doc.content +
        "\n\n" +
        generateApiFunctionSection(doc, moduleItemToCompressedFormat)
      );
    })
    .join("\n\n\n");
}

function getGuideContent() {
  const docs = allDocs.filter(
    (doc) =>
      doc._meta.directory === "Guides" &&
      !["Roadmap", "Debugging"].includes(doc.title)
  );

  // Sort docs by the order of the pages in the Guides metadata.
  // This matches Fumadocs behavior, which we assume is the most natural ordering both for humans and LLMs.
  const sortedPageNames = allMetas
    .filter((meta) => meta._meta.directory === "Guides")
    .at(0)?.pages;

  if (!sortedPageNames) {
    throw new Error("Failed to extract page names from Guides metadata");
  }

  docs.sort(
    (a, b) =>
      sortedPageNames.findIndex((p) => `Guides/${p}` === a._meta.path) -
      sortedPageNames.findIndex((p) => `Guides/${p}` === b._meta.path)
  );

  return docs
    .map((doc) => {
      return `# ${doc.title}

${doc.description}
${doc.content}
`;
    })
    .join("\n\n\n");
}

function getBasicPrompt() {
  const promptDoc = allDocs.find(
    (doc) => doc._meta.filePath === "Ecosystem/BasicPrompt.mdx"
  );
  if (!promptDoc) {
    throw new Error("Basic Prompt not found");
  }

  const prompt = promptDoc.content.split("---")[1];

  if (!prompt) {
    throw new Error("Failed to extract prompt from Basic Prompt doc");
  }

  return prompt;
}

function getLLMStyleGuide() {
  const filename = "Ecosystem/LLMStyleGuide.mdx";
  const doc = allDocs.find((doc) => doc._meta.filePath === filename);
  if (!doc) {
    throw new Error(`${filename} not found`);
  }

  return doc.content;
}

export async function getDocumentationBundle() {
  console.log("Compiling documentation bundle page...");

  const basicPrompt = getBasicPrompt();
  const styleGuideRaw = getLLMStyleGuide();
  const guideContent = getGuideContent();
  const apiContent = allDocumentationItems();
  const content =
    basicPrompt +
    "\n\n" +
    styleGuideRaw +
    "\n\n" +
    convertSquiggleEditorTags(guideContent) +
    "\n\n---\n\n" +
    "# API\n\n" +
    apiContent;

  return content;
}
