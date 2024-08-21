#!/usr/bin/env node
import fs from "fs";

const SQUIGGLE_DOCS_PATH = "./src/llmScript/prompt.md";

// Utility functions
const readTxtFileSync = (filePath: string) => {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (err) {
    console.error(`Error reading file: ${err}`);
    throw err;
  }
};
// Load Squiggle docs
export const squiggleDocs = readTxtFileSync(SQUIGGLE_DOCS_PATH);
