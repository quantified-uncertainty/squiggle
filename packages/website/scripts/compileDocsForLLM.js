#!/usr/bin/env node
const { glob } = require("glob");
const fs = require("fs");

const readFile = (fileName) => {
  return fs.readFileSync(fileName, "utf-8");
};

const documentationBundlePage = async () => {
  const targetFilename = "./public/llms/documentationBundle.txt";

  const header = `# Squiggle Documentation, One Page
This file is auto-generated from the documentation files in the Squiggle repository. It includes our Peggy Grammar. It is meant to be given to an LLM. It is not meant to be read by humans.
--- \n\n
`;

  const getGrammarContent = async () => {
    const grammarFiles = await glob("../squiggle-lang/src/**/*.peggy");
    return readFile(grammarFiles[0]);
  };

  const getDocumentationContent = async () => {
    const documentationFiles = await glob(
      "./src/pages/docs/{Api,Guides}/*.{md,mdx}"
    );
    return documentationFiles.map(readFile).join("\n\n\n");
  };

  console.log("Compiling documentation bundle page...");
  const grammarContent = await getGrammarContent();
  const documentationContent = await getDocumentationContent();
  const content =
    header +
    `## Peggy Grammar \n\n ${grammarContent} \n\n --- \n\n ` +
    documentationContent;
  fs.writeFile(targetFilename, content, (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(`Content written to ${targetFilename}`);
  });
};

const promptPage = async () => {
  console.log("Compiling prompt page...");
  const promptPage = readFile("./public/llms/prompt.txt");
  const introduction = `---
description: LLM Prompt Example
notes: "This Doc is generated using a script, do not edit directly!"
---

# LLM Prompt Example

The following is a prompt that we use to help LLMs, like GPT and Claude, write Squiggle code. This would ideally be provided with the full documentation, for example with [this document](/llms/documentationBundle.txt). 

You can read this document in plaintext [here](/llms/prompt.txt).

---

`;
  const target = "./src/pages/docs/Ecosystem/LLMPrompt.md";
  // fs.writeFile(
  //   target,
  //   introduction + promptPage.replace(/\`squiggle/g, "`js"),
  //   (err) => {
  //     if (err) {
  //       console.error(err);
  //       return;
  //     }
  //     console.log(`Content written to ${target}`);
  //   }
  // );
};

async function main() {
  await documentationBundlePage();
  await promptPage();
}

main();
