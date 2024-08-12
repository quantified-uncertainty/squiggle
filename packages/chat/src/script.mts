#!/usr/bin/env node
import boxen from "boxen";
import chalk from "chalk";
import dotenv from "dotenv";
import fs from "fs";
import OpenAI from "openai";

import { SqProject } from "@quri/squiggle-components";
import { SqLinker } from "@quri/squiggle-lang";

const linker: SqLinker = {
  resolve: (name) => name,
  loadSource: async (sourceName) => {
    // Note how this function is async and can load sources remotely on demand.
    switch (sourceName) {
      case "hub:ozziegooen/sTest":
        return `
@startClosed
createExpectation(actual) = {
  toBe: {
    |expected|
    if actual != expected then "Expected " + expected + " but got " +
      actual else true
  },
  toBeGreaterThan: {
    |expected|
    if actual <= expected then "Expected " + actual + " to be greater than " +
      expected else true
  },
  toBeLessThan: {
    |expected|
    if actual >= expected then "Expected " + actual + " to be less than " +
      expected else true
  },
  toBeTrue: {|| if !actual then "Expected true but got " + actual else true},
  toBeFalse: {|| if actual then "Expected false but got " + actual else true},
}

runTest(test) = {
  fnResult = test.fn()
  {
    name: test.name,
    passed: fnResult == true,
    error: if fnResult != true then fnResult else "",
  }
}

@startClosed
generateTestReport(name, testResults) = {
  passedTests = List.filter(testResults, {|t| t.passed})
  failedTests = List.filter(testResults, {|t| !t.passed})

  [
    "## Test Suite: " + name + "  ",
    "**Total tests**: " + List.length(testResults) + "  ",
    "**Passed**: " + List.length(passedTests) + "  ",
    "**Failed**: " + List.length(failedTests),
    "",
    "**Results:**  ",
  ]
}

@startClosed
formatTestResult(testResult) = (if testResult.passed then "✅" else "❌") +
  "  " +
  testResult.name +
  (if testResult.error != "" then "
    --- Error: *" + testResult.error +
    "*" else "") +
  "  "

// Main squiggleJest framework
@startClosed
squiggleJest = {
  expect: createExpectation,
  test: {|name, fn| { name: name, fn: fn }},
  describe: {
    |name, tests|
    testResults = List.map(tests, runTest)
    report = generateTestReport(name, testResults)
    testDetails = List.map(testResults, formatTestResult)
    List.concat(report, testDetails) -> List.join("
")
  },
}

export test = squiggleJest.test
export describe = squiggleJest.describe
export expect = squiggleJest.expect

/// Testing ---
model = { items: [1, 2, 3] }
  
testResults = describe(
  "Model Tests",
  [
    test(
      "has items with length 3",
      {|| expect(List.length(model.items)).toBe(3)}
    ),
    test("first item is 1", {|| expect(model.items[0]).toBe(1)}),
    test(
      "last item is greater than 2",
      {|| expect(model.items[2]).toBeGreaterThan(1)}
    ),
    test(
      "second item is less than 3",
      {|| expect(model.items[1]).toBeLessThan(8)}
    ),
    test(
      "contains truthy value",
      {|| expect(List.some(model.items, {|i| i > 0})).toBeTrue()}
    ),
    test(
      "doesn't contain 4",
      {|| expect(List.some(model.items, {|i| i == 4})).toBeFalse()}
    ),
    test("this test should fail", {|| expect(1).toBe(2)}),
  ]
)`;

      default:
        throw new Error(`source ${sourceName} not found`);
    }
  },
};

// Configuration
dotenv.config({ path: ".env.local" });
const MAX_ATTEMPTS = 10;
const SQUIGGLE_DOCS_PATH = "./src/prompt.txt";
const OPENROUTER_MODEL = "openai/gpt-4o-2024-08-06";
// const OPENROUTER_MODEL = "openai/gpt-4o-mini";

// Initialize OpenRouter client
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Tracking info
const trackingInfo = {
  time: { createSquiggleCode: 0, validateAndFixCode: 0 },
  tokens: { input: 0, output: 0 },
};

// Utility functions
const readTxtFileSync = (filePath) => {
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

const measureTime = async (fn) => {
  const start = Date.now();
  const result = await fn();
  const duration = (Date.now() - start) / 1000;
  return { result, duration };
};

const updateTrackingInfo = (duration, usage) => {
  trackingInfo.time.createSquiggleCode += duration;
  trackingInfo.tokens.input += usage.prompt_tokens;
  trackingInfo.tokens.output += usage.completion_tokens;
};

// Squiggle-related functions
const runSquiggle = async (code) => {
  const project = SqProject.create({ linker: linker });
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

const generateSquiggleContent = (prompt, existingCode, error) => {
  const isFixing = Boolean(existingCode);
  return isFixing
    ? `Fix the following Squiggle code. It produced this error: ${error}\n\nCode:\n${existingCode}\n\n. Explain your thinking in detail. Think step by step. Wrap the code in \`\`\`squiggle tags. \n\n Information on Squiggle Language: \n\n\n ${squiggleDocs}`
    : `Generate Squiggle code for the following prompt. Mainly produce code, short explanations. Wrap the code in \`\`\`squiggle tags.\n\nPrompt: ${prompt}. \n\n\n Information about the Squiggle Language: \n\n\n ${squiggleDocs}`;
};

const createSquiggleCode = async (prompt, existingCode = "", error = "") => {
  const content = generateSquiggleContent(prompt, existingCode, error);
  const { result: completion, duration } = await measureTime(async () =>
    openai.chat.completions.create({
      model: OPENROUTER_MODEL,
      messages: [{ role: "user", content }],
    })
  );

  updateTrackingInfo(duration, completion.usage);
  console.log(
    chalk.cyan(
      `✨ Got response from OpenRouter ${existingCode ? "(fix attempt)" : "(initial generation)"}`
    )
  );

  const extractedCode = extractSquiggleCode(
    completion.choices[0].message.content
  );
  if (!extractedCode) {
    console.error(
      chalk.red("❌ Error generating/fixing Squiggle code. Didn't get code.")
    );
  }
  return extractedCode;
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

      const { result: newCode, duration } = await measureTime(() =>
        createSquiggleCode(prompt, code, run.value)
      );
      trackingInfo.time.validateAndFixCode += duration;
      code = newCode;

      displayCode(code, "Fixed Code:");
      attempts++;
    }
  }

  return { isValid, code };
};

const printSummary = () => {
  console.log(chalk.blue.bold("\n📊 Summary:"));
  console.log(
    `Total time spent creating Squiggle code: ${trackingInfo.time.createSquiggleCode.toFixed(2)} seconds`
  );
  console.log(
    `Total time spent validating and fixing code: ${trackingInfo.time.validateAndFixCode.toFixed(2)} seconds`
  );
  console.log(`Total input tokens: ${trackingInfo.tokens.input}`);
  console.log(`Total output tokens: ${trackingInfo.tokens.output}`);
};

// Main function
const main = async () => {
  const prompt =
    "Make a very complicated stochastic simulation of a person's finances over time, who has 5+ different asset classes. 400+ lines of code.\n\n" +
    "Keep this part simple. Do not use any annotations ('@name', '@doc'), do not use domains (i.e. f(t: [2,3])), do not use custom visualizations or calculators yet. Just get the core functionality right. Use the sTest library for tests.";

  console.log(chalk.blue.bold("\n🚀 Starting Squiggle Code Generation\n"));
  console.log(chalk.magenta("Prompt:"), prompt);

  console.log(chalk.cyan("\n📝 Generating initial Squiggle code..."));
  const { result: initialCode, duration } = await measureTime(() =>
    createSquiggleCode(prompt)
  );
  trackingInfo.time.createSquiggleCode += duration;
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

  printSummary();
};

// Load Squiggle docs
const squiggleDocs = readTxtFileSync(SQUIGGLE_DOCS_PATH);

// Run the main function
main().catch((error) => {
  console.error(chalk.red.bold("\n💥 An unexpected error occurred:"));
  console.error(chalk.red(error));
});
