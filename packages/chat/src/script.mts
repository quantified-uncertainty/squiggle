#!/usr/bin/env node
import { Anthropic } from "@anthropic-ai/sdk";
import boxen from "boxen";
import chalk from "chalk";
import dotenv from "dotenv";

import { SqProject } from "@quri/squiggle-components";

import * as allPrompts from "./squigglePrompts.mjs";

console.log(allPrompts);
// Load environment variables
dotenv.config({ path: ".env.local" });

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function runSquiggle(
  code: string
): Promise<{ ok: boolean; value?: string }> {
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
}

async function generateOrFixSquiggleCode(
  prompt: string,
  existingCode?: string,
  error?: string
): Promise<string> {
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    {
      role: "user",
      content: existingCode
        ? `Fix the following Squiggle code. It produced this error: ${error}\n\nCode:\n${existingCode}\n\n. Explain your thinking. Wrap the code in \`\`\`squiggle tags.`
        : `Generate Squiggle code for the following prompt. Mainly produce code, short explanations. Wrap the code in \`\`\`squiggle tags.\n\nPrompt: ${prompt}. \n\n\n Information about the Squiggle Language: \n\n\n ${allPrompts.standardPrompt}`,
    },
  ];

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      messages,
    });
    console.log(
      chalk.cyan(
        `✨ Got response from Claude ${existingCode ? "(fix attempt)" : "(initial generation)"}`
      )
    );
    console.log("message: ", message.content[0]);
    const extracted = extractSquiggleCode(message.content[0].text);
    if (extracted !== message.content[0].text) {
      console.error(
        chalk.red("❌ Error generating/fixing Squiggle code. Didn't get code."),
        message.content[0]
      );
    }
    return extracted;
  } catch (error) {
    console.error(
      chalk.red("❌ Error generating/fixing Squiggle code:"),
      error
    );
    throw error;
  }
}

function extractSquiggleCode(content: string): string {
  const match = content.match(/```squiggle([\s\S]*?)```/);
  return match ? match[1].trim() : "";
}

function displayCode(code: string, title: string) {
  console.log(chalk.yellow(title));
  console.log(boxen(chalk.green(code), { padding: 1, borderColor: "yellow" }));
}

async function main() {
  const prompt =
    "Create a model that estimates the probability of rain tomorrow based on today's temperature and humidity.";
  console.log(chalk.blue.bold("\n🚀 Starting Squiggle Code Generation\n"));
  console.log(chalk.magenta("Prompt:"), prompt);

  console.log(chalk.cyan("\n📝 Generating initial Squiggle code..."));
  let code = await generateOrFixSquiggleCode(prompt);
  displayCode(code, "Generated Code:");

  let isValid = false;
  let attempts = 0;
  const MAX_ATTEMPTS = 3;

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
      code = await generateOrFixSquiggleCode(prompt, code, run.value);
      displayCode(code, "Fixed Code:");
      attempts++;
    }
  }

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
}

main().catch((error) => {
  console.error(chalk.red.bold("\n💥 An unexpected error occurred:"));
  console.error(chalk.red(error));
});
