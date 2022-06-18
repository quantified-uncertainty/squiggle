#!/usr/bin/env node

import fs from "fs";
import path from "path";
import indentString from "indent-string";
import chokidar from "chokidar";
import chalk from "chalk";
import { Command } from "commander";
import glob from "glob";

function run(fileName) {
  const fileContents = fs.readFileSync(fileName, "utf-8");

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
      const data = fs.readFileSync(
        importFileName,
        { encoding: "utf8" },
        function (err, _data) {
          if (err) {
            console.log(`Error importing ${importFileName}: `, err);
            return false;
          }
          return _data;
        }
      );
      if (data) {
        let importString = `${rename} = {\n${indentString(data, 2)}\n}`;
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
  const parsedPath = path.parse(fileName)
  const newFilename = parsedPath.dir + "/" + parsedPath.name + ".squiggle";
  fs.writeFileSync(newFilename, newerContent);
  console.log(chalk.cyan(`Updated ${fileName} -> ${newFilename}`));
}

function compile() {
  glob("**/*.squiggleU", (_err, files) => {
    files.forEach(run);
  });
}

function watch() {
  chokidar
    .watch("**.squiggleU")
    .on("ready", () => console.log(chalk.green("Ready!")))
    .on("change", (event, _) => {
        run(event);
    });
}

const program = new Command();

program
  .name("squiggle-utils")
  .description("CLI to transform squiggle files with @imports")
  .version("0.0.1");

program
  .command("watch")
  .description("watch files and compile on the fly")
  .action(() => {
    watch();
  });

program
  .command("compile")
  .description("compile all .squiggleU files into .squiggle files")
  .action(() => {
    compile();
  });

program.parse();
