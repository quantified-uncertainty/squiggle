#!/usr/bin/env node
import fs from "fs";

import { SqProject } from "@quri/squiggle-components";
import { SqLinker } from "@quri/squiggle-lang";

import { Logger } from "./logger.mts";

const SQUIGGLE_DOCS_PATH = "./src/llmScript/prompt.md";

const linker: SqLinker = {
  resolve: (name: string) => name,
  loadSource: async (sourceName: string) => {
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

// Squiggle-related functions
export const runSquiggle = async (code) => {
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

// I haven't tested this, am not sure if it will work.
export function getSquiggleAdvice(errorMessage: string): string {
  // Define regex patterns for each error and their corresponding advice
  const patterns = [
    {
      pattern:
        /Failed to evaluate Squiggle code: Expected "->", end of input, or whitespace but ".*?" found./,
      advice: `This likely means that you are using two return statements in the top-level of the function call. 
      Every statement but the last should be a variable assignment. Don't: foo = 4; bar = foo + 3; bar; foo;
      Do: foo = 4; bar = foo + 3; foo;`,
    },
    {
      pattern: /Expected "->", end of input, or whitespace but ".*?" found./,
      advice: `This likely means the same as the above error. You returned a statement, and then had a variable assignment.
      All statements except for the last must be variable assignment.`,
    },
    {
      pattern:
        /Expected "\(.*?\) \{.*?\}.*, array, boolean, dict, end of input, identifier, number, string, unary operator, or whitespace but '.*?' found./,
      advice: `Did you use "#" as a line comment? That's not valid in Squiggle. Use "//" instead.`,
    },
    {
      pattern:
        /Expected "\(.*?\{.*?\}.*, array, boolean, dict, identifier, number, string, unary operator, or whitespace but '.*?' found./,
      advice: `Did you try using "+=" or "-=" or similar? These are not allowed in Squiggle, as you cannot mutate variables.`,
    },
    {
      pattern:
        /Expected "\(.*?\.*?" end of input, or whitespace but ".*?" found./,
      advice: `This likely means that you have a block without a return statement. Don't: foo = { a = 1 b = a + 3 }
      Do: foo = { a = 1 a + 3 }`,
    },
    {
      pattern: /Number is not defined/,
      advice: `Are you trying to use Number as a Type? This is not supported. Domains are very restricted, see that documentation.`,
    },
    {
      pattern:
        /Failed to evaluate Squiggle code: Expected "->", "?", assignment, end of input, operator, or whitespace/,
      advice: `Did you have an import statement that's not on the top of the file? Make sure that all import statements are on the top of the file.`,
    },
  ];

  // Check the error message against each pattern and return the corresponding advice
  for (const { pattern, advice } of patterns) {
    if (pattern.test(errorMessage)) {
      return advice;
    }
  }

  // If no pattern matches, return a default message
  return "";
}

// Utility functions
const readTxtFileSync = (filePath: string) => {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (err) {
    Logger.error(`Error reading file: ${err}`);
    throw err;
  }
};
// Load Squiggle docs
export const squiggleDocs = readTxtFileSync(SQUIGGLE_DOCS_PATH);
