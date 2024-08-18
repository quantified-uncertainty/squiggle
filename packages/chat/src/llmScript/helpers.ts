#!/usr/bin/env node
import fs from "fs";
import * as prettier from "prettier/standalone";

import * as prettierSquigglePlugin from "@quri/prettier-plugin-squiggle/standalone";
import { result, SqLinker, SqProject } from "@quri/squiggle-lang";

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
  const output = project.getOutput("wrapper");

  const outputJS = output.ok && {
    result: output.value.result.asJS(),
    bindings: output.value.bindings.asValue().asJS(),
  };

  return result.ok
    ? { ok: true, output: outputJS }
    : {
        ok: false,
        value: `Failed to evaluate Squiggle code: ${result.value}`,
      };
};

type ErrorPattern = {
  pattern: RegExp;
  advice: string;
};

type InvalidElement = {
  check: (line: string) => boolean;
  getMessage: (lineNumber: number) => string;
};

function getSquiggleErrorPatterns(): ErrorPattern[] {
  return [
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
      pattern:
        / "{", array, boolean, dict, identifier, number, string, unary operator, or whitespace but/,
      advice: `This likely means that you have a block without a return statement. Don't: foo = { a = 1 \n b = a + 3 }. Instead, return with one single value. If you instead want to return a Dict, then the format is {a:3, b:5, c:10}.`,
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
    {
      pattern:
        /"if", "{", array, boolean, dict, identifier, number, string, or unary operator but ".*?" found./,
      advice: `Do you have two returns in a block? You can only have one, at the end. Everything else should be a variable declaration.`,
    },
  ];
}

// Function to define invalid Squiggle elements
function getInvalidSquiggleElements(): InvalidElement[] {
  const commonUndefinedElements = [
    "List.sum",
    "List.map2",
    "List.keys",
    "List.sample",
    "List.sampleN",
    "List.repeat",
    "Number.parseFloat",
    "Duration.toMonths",
  ];
  return [
    {
      check: (line: string) => /\b(null|nil|undefined)\b/.test(line),
      getMessage: (lineNumber: number) =>
        `Line ${lineNumber}: The use of 'null' or 'nil' is not valid in Squiggle. Use an empty string or false for null values.`,
    },
    {
      check: (line: string) => {
        // Ignore lines starting with @ (decorators)
        if (line.trim().startsWith("@")) return false;

        // Ignore content within string literals
        const withoutStrings = line.replace(/"(?:[^"\\]|\\.)*"/g, '""');

        // Check for type annotations
        return /\b\w+\s*:\s*[A-Z]\w+(?:\s*[,)]|$)/.test(withoutStrings);
      },
      getMessage: (lineNumber: number) =>
        `Line ${lineNumber}: Type annotation like 'variableName: Type' is not valid in Squiggle. Squiggle uses structural typing.`,
    },
    {
      check: (line: string) => {
        return commonUndefinedElements.some(
          (element) =>
            new RegExp(`\\b${element}\\b`).test(line) &&
            !line.includes(`${element} is not defined`)
        );
      },
      getMessage: (lineNumber: number) =>
        `Line ${lineNumber}: A common function or object (like List.sum, Number, etc.) is used but not defined in Squiggle. Check for typos or missing imports.`,
    },
    {
      // New check for Date.now
      check: (line: string) => /\bDate\.now\b/.test(line),
      getMessage: (lineNumber: number) =>
        `Line ${lineNumber}: 'Date.now' is not available in Squiggle. Use 'Danger.now' instead for the current timestamp.`,
    },
  ];
}

// Function to check for invalid Squiggle elements
function checkInvalidSquiggleElements(code: string): string[] {
  const warnings: string[] = [];
  const lines = code.split("\n");
  const invalidElements = getInvalidSquiggleElements();

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    invalidElements.forEach((element) => {
      if (element.check(line)) {
        warnings.push(element.getMessage(lineNumber));
      }
    });
  });

  return warnings;
}

// Main function to get Squiggle advice
export function getSquiggleAdvice(errorMessage: string, code: string): string {
  let advice = "";

  // Check for error-based advice
  const errorPatterns = getSquiggleErrorPatterns();
  for (const { pattern, advice: errorAdvice } of errorPatterns) {
    if (pattern.test(errorMessage)) {
      advice += errorAdvice + "\n\n";
      break; // Only use the first matching error advice
    }
  }

  // Check for invalid elements in the code
  const warnings = checkInvalidSquiggleElements(code);
  if (warnings.length > 0) {
    advice += "Additional warnings:\n" + warnings.join("\n") + "\n\n";
    advice +=
      "Remember that Squiggle doesn't use explicit type annotations and 'null' or 'nil' are not valid. Use 'None' for optional values.\n";
  }

  return advice.trim(); // Remove any trailing whitespace
}

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

export const formatSquiggleCode = async (
  code: string
): Promise<result<string, string>> => {
  try {
    const formatted = await prettier.format(code, {
      parser: "squiggle",
      plugins: [prettierSquigglePlugin],
    });
    return { ok: true, value: formatted };
  } catch (error) {
    return {
      ok: false,
      value: `Error formatting Squiggle code: ${error.message}`,
    };
  }
};
