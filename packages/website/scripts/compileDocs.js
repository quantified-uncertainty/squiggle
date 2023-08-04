#!/usr/bin/env node
const { glob } = require("glob");
const fs = require("fs");

const targetFilename = "./allContent.txt";

const readFile = (fileName) => {
  return fs.readFileSync(fileName, "utf-8");
};

const header = `# Squiggle Documentation, One Page
This file is auto-generated from the documentation files in the Squiggle repository. It includes our Peggy Grammar. It is meant to be given to an LLM. It is not meant to be read by humans.
--- \n\n
`;

const getGrammarContent = async () => {
  const grammarFiles = await glob("../squiggle-lang/**/*.peggy");
  return readFile(grammarFiles[0]);
};

const getDocumentationContent = async () => {
  const documentationFiles = await glob("./src/pages/docs/**/*.{md,mdx}");
  return documentationFiles.map(readFile).join("\n\n\n");
};

const compile = async () => {
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

async function main() {
  await compile();
}

main();
