#!/usr/bin/env node
import { Anthropic } from "@anthropic-ai/sdk";
import boxen from "boxen";
import chalk from "chalk";
import dotenv from "dotenv";
import fs from "fs";

import { SqProject } from "@quri/squiggle-components";

// Configuration
dotenv.config({ path: ".env.local" });
const MAX_ATTEMPTS = 5;
const SQUIGGLE_DOCS_PATH = "./src/prompt.txt";
// const ANTHROPIC_MODEL = "claude-3-haiku-20240307";
const ANTHROPIC_MODEL = "claude-3-5-sonnet-20240620";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Utility functions
const loadTxtFileSync = (filePath) => {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (err) {
    console.error(chalk.red("Error reading file:"), err);
    throw err;
  }
};

const extractSquiggleCode = (content) => {
  const match = content.match(/```squiggle([\s\S]*?)```/);
  return match ? match[1].trim() : "";
};

const displayCode = (code, title) => {
  console.log(chalk.yellow(title));
  console.log(chalk.green(code));
};

// Squiggle-related functions
const runSquiggle = async (code) => {
  const project = SqProject.create({});
  project.setSource("wrapper", code);
  await project.run("wrapper");
  const result = project.getResult("wrapper");

  return result.ok
    ? { ok: true }
    : {
        ok: false,
        value: `Failed to evaluate Squiggle code: ${result.value.toStringWithDetails(project)}`,
      };
};

const createSquiggleCode = async (prompt, existingCode = "", error = "") => {
  const isFixing = Boolean(existingCode);
  const content = isFixing
    ? `Fix the following Squiggle code. It produced this error: ${error}\n\nCode:\n${existingCode}\n\n. Explain your thinking. Wrap the code in \`\`\`squiggle tags. \n\n Information on Squiggle Language: \n\n\n ${squiggleDocs}`
    : `Generate Squiggle code for the following prompt. Mainly produce code, short explanations. Wrap the code in \`\`\`squiggle tags.\n\nPrompt: ${prompt}. \n\n\n Information about the Squiggle Language: \n\n\n ${squiggleDocs}`;

  try {
    const message = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 4000,
      messages: [{ role: "user", content }],
    });

    console.log(
      chalk.cyan(
        `✨ Got response from Claude ${isFixing ? "(fix attempt)" : "(initial generation)"}`
      )
    );
    console.log("Response tokens count:", message.usage);

    const extractedCode = extractSquiggleCode(message.content[0].text);
    if (!extractedCode) {
      console.error(
        chalk.red("❌ Error generating/fixing Squiggle code. Didn't get code.")
      );
    }
    return extractedCode;
  } catch (error) {
    console.error(
      chalk.red("❌ Error generating/fixing Squiggle code:"),
      error
    );
    throw error;
  }
};

const validateAndFixCode = async (prompt, initialCode) => {
  let code = initialCode;
  let isValid = false;
  let attempts = 0;

  while (!isValid && attempts < MAX_ATTEMPTS) {
    console.log(
      chalk.yellow(
        `\n🧪 Attempt ${attempts + 1}/${MAX_ATTEMPTS}: Validating code...`
      )
    );
    const run = await runSquiggle(code);

    if (run.ok) {
      isValid = true;
      console.log(chalk.green("✅ Code is valid!"));
    } else {
      console.log(chalk.red(`❌ Validation error:`));
      console.log(
        boxen(chalk.red(run.value), { padding: 1, borderColor: "red" })
      );
      console.log(chalk.cyan("\n🔧 Attempting to fix the code..."));
      code = await createSquiggleCode(prompt, code, run.value);
      displayCode(code, "Fixed Code:");
      attempts++;
    }
  }

  return { isValid, code };
};

// Main function
const main = async () => {
  const prompt =
    "Make a very complicated stochastic simulation of a person's finances over time, who has 5+ different asset classes. 400+ lines of code. \n\n Keep this part simple. Do not use any annotations ('@name', '@doc'), do not use domains (i.e. f(t: [2,3])), do not use custom visualizations or calculators yet. Just get the core functionality right. Use the sTest library for tests.";

  console.log(chalk.blue.bold("\n🚀 Starting Squiggle Code Generation\n"));
  console.log(chalk.magenta("Prompt:"), prompt);

  console.log(chalk.cyan("\n📝 Generating initial Squiggle code..."));
  let initialCode = await createSquiggleCode(prompt);
  displayCode(initialCode, "Generated Code:");

  const { isValid, code } = await validateAndFixCode(prompt, initialCode);

  console.log(chalk.blue.bold("\n🏁 Final Result:"));
  if (isValid) {
    console.log(chalk.green("✅ Successfully generated valid Squiggle code!"));
    displayCode(code, "Final Valid Squiggle Code:");
  } else {
    console.log(
      chalk.red(
        `❌ Failed to generate valid Squiggle code after ${MAX_ATTEMPTS} attempts.`
      )
    );
  }
};

// Load Squiggle docs
const squiggleDocs = loadTxtFileSync(SQUIGGLE_DOCS_PATH);

// Run the main function
main().catch((error) => {
  console.error(chalk.red.bold("\n💥 An unexpected error occurred:"));
  console.error(chalk.red(error));
});
