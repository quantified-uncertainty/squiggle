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
  const result = input.replace(
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

function getDocsInDirectory(directory: string) {
  const docs = allDocs.filter((doc) => doc._meta.directory === directory);

  // Sort docs by the order of the pages in the Guides metadata.
  // This matches Fumadocs behavior, which we assume is the most natural ordering both for humans and LLMs.
  const sortedPageNames = allMetas
    .filter((meta) => meta._meta.directory === directory)
    .at(0)?.pages;

  if (!sortedPageNames) {
    throw new Error(`Failed to extract page names from ${directory} metadata`);
  }

  docs.sort(
    (a, b) =>
      sortedPageNames.findIndex((p) => `${directory}/${p}` === a._meta.path) -
      sortedPageNames.findIndex((p) => `${directory}/${p}` === b._meta.path)
  );

  return docs;
}

function docToSimplfiiedMarkdown(
  doc: (typeof allDocs)[number],
  opts: {
    removePrelude?: boolean;
    skipDescription?: boolean;
    skipTitle?: boolean;
  } = {
    removePrelude: false,
    skipDescription: false,
    skipTitle: false,
  }
) {
  let content = doc.content;
  if (opts?.removePrelude) {
    content = content.split("---")[1];
    if (!content) {
      throw new Error(`Failed to extract content from ${doc.title}`);
    }
  }

  return (
    (opts.skipTitle ? "" : `# ${doc.title}\n\n`) +
    (opts.skipDescription ? "" : `${doc.description}\n`) +
    `${content}\n`
  );
}

function getGuideContent() {
  const docs = getDocsInDirectory("Guides").filter(
    (doc) => !["Roadmap", "Debugging"].includes(doc.title)
  );

  return docs.map((doc) => docToSimplfiiedMarkdown(doc)).join("\n\n\n");
}

function getDocByFilename(filename: string) {
  const doc = allDocs.find((doc) => doc._meta.filePath === filename);
  if (!doc) {
    throw new Error(`${filename} not found`);
  }

  return doc;
}

function getBasicPrompt() {
  const doc = getDocByFilename("Ecosystem/BasicPrompt.mdx");
  return docToSimplfiiedMarkdown(doc, {
    removePrelude: true,
    skipDescription: true,
    skipTitle: true,
  });
}

export async function getLLMStyleGuide() {
  const doc = getDocByFilename("Ecosystem/LLMStyleGuide.mdx");
  return docToSimplfiiedMarkdown(doc, { removePrelude: true });
}

export async function getDocumentationBundle() {
  console.log("Compiling documentation bundle page...");

  const basicPrompt = getBasicPrompt();
  const styleGuide = await getLLMStyleGuide();
  const guideContent = getGuideContent();
  const apiContent = allDocumentationItems();

  const content =
    basicPrompt +
    "\n\n" +
    styleGuide +
    "\n\n" +
    convertSquiggleEditorTags(guideContent) +
    "\n\n---\n\n" +
    "# API\n\n" +
    apiContent;

  return content;
}
