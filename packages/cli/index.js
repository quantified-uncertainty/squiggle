#!/usr/bin/env node

import fs from "fs";
import path from "path";
import indentString from "indent-string";
import chokidar from "chokidar";
import chalk from "chalk";
import { Command } from "commander";
import { glob } from "glob";

const processFile = (fileName, seen = []) => {
  const normalizedFileName = path.resolve(fileName);
  if (seen.includes(normalizedFileName)) {
    throw new Error(`Recursive dependency for file ${fileName}`);
  }

  const fileContents = fs.readFileSync(fileName, "utf-8");
  if (!fileName.endsWith(".squiggleU")) {
    return fileContents;
  }

  const regex = /\@import\(\s*([^)]+?)\s*\)/g;
  const matches = Array.from(fileContents.matchAll(regex)).map((r) =>
    r[1].split(/\s*,\s*/)
  );
  const newContent = fileContents.replaceAll(regex, "");
  const appendings = [];

  matches.forEach((r) => {
    const importFileName = r[0];
    const rename = r[1];
    const item = fs.statSync(importFileName);
    if (item.isFile()) {
      const data = processFile(importFileName, [...seen, normalizedFileName]);
      if (data) {
        const importString = `${rename} = {\n${indentString(data, 2)}\n}\n`;
        appendings.push(importString);
      }
    } else {
      console.log(
        chalk.red(`Import Error`) +
          `: ` +
          chalk.cyan(importFileName) +
          ` not found in file ` +
          chalk.cyan(fileName) +
          `. Make sure the @import file names all exist in this repo.`
      );
    }
  });
  const imports = appendings.join("\n");

  const newerContent = imports.concat(newContent);
  return newerContent;
};

const run = (fileName) => {
  const content = processFile(fileName);
  const parsedPath = path.parse(path.resolve(fileName));
  const newFilename = `${parsedPath.dir}/${parsedPath.name}.squiggle`;
  fs.writeFileSync(newFilename, content);
  console.log(chalk.cyan(`Updated ${fileName} -> ${newFilename}`));
};

const compile = async () => {
  const files = await glob("**/*.squiggleU");

  files.forEach(run);
};

const watch = () => {
  chokidar
    .watch("**.squiggleU")
    .on("ready", () => console.log(chalk.green("Ready!")))
    .on("change", (event, _) => {
      run(event);
    });
};

const program = new Command();

program
  .name("squiggle-utils")
  .description("CLI to transform squiggle files with @imports")
  .version("0.0.1");

program
  .command("watch")
  .description("watch files and compile on the fly")
  .action(watch);

program
  .command("compile")
  .description("compile all .squiggleU files into .squiggle files")
  .action(compile);

program.parse();
