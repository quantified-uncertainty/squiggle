#!/usr/bin/env node
const { glob } = require("glob");
const fs = require("fs");

const run = (fileName) => {
  return fs.readFileSync(fileName, "utf-8");
};

const compile = async () => {
  const files = await glob(
    "{./packages/website/src/pages/**/*.{md,mdx},./packages/squiggle-lang/**/*.peggy}"
  );
  const content = files.map(run).join("\n");
  // Write the content to the file "foo.md"
  fs.writeFile("foo.md", content, (err) => {
    if (err) {
      console.error("Error writing to file:", err);
      return;
    }
    console.log("Content written to foo.md");
  });
};

async function main() {
  await compile();
}

main();
